#!/usr/bin/env python3
import datetime
import os
import time
import logging
from kubernetes import client, config
from kubernetes.client.rest import ApiException

# ---------------------------------------------------------------------------
# Configuration & Initialization
# ---------------------------------------------------------------------------

POD_NAME      = os.environ["POD_NAME"]         # Injected via Downward API
NAMESPACE     = os.environ["POD_NAMESPACE"]    # Injected via Downward API
LEASE_NAME    = os.environ.get("LEASE_NAME", "redis-primary")
LABEL_KEY     = "redis-role"
LABEL_PRIMARY = "primary"

LEASE_DURATION = int(os.environ.get("LEASE_DURATION", "15"))
RENEW_INTERVAL = int(os.environ.get("RENEW_INTERVAL", "5"))
RETRY_INTERVAL = int(os.environ.get("RETRY_INTERVAL", "3"))

# Setup structured logging context with Pod name prefix
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logging.getLogger().handlers[0].setFormatter(
    logging.Formatter(f"%(asctime)s [%(levelname)s] [{POD_NAME}] %(message)s")
)

configuration = client.Configuration()
try:
    config.load_incluster_config(client_configuration=configuration)
except config.ConfigException:
    logger.warning("Not in-cluster — falling back to local kubeconfig (dev mode)")
    config.load_kube_config(client_configuration=configuration)

token_path = "/var/run/secrets/kubernetes.io/serviceaccount/token"
if os.path.exists(token_path):
    with open(token_path) as token_file:
        raw = token_file.read().strip()
    token = raw.removeprefix("bearer ").removeprefix("Bearer ")
    configuration.api_key = {"BearerToken": token}
    configuration.api_key_prefix = {"BearerToken": "Bearer"}

api_client = client.ApiClient(configuration=configuration)
core = client.CoreV1Api(api_client=api_client)
coord = client.CoordinationV1Api(api_client=api_client)

# ---------------------------------------------------------------------------
# K8s Lease API Helpers
# ---------------------------------------------------------------------------

def _get_lease() -> client.V1Lease | None:
    """Safely fetch the lease object. Returns None if it doesn't exist."""
    try:
        return coord.read_namespaced_lease(name=LEASE_NAME, namespace=NAMESPACE)
    except ApiException as e:
        if e.status == 404:
            return None
        raise

def _create_lease() -> bool:
    """Attempt to create the lease object from scratch. Handles 409 conflicts."""
    now = datetime.datetime.now(datetime.UTC)
    body = client.V1Lease(
        metadata=client.V1ObjectMeta(name=LEASE_NAME, namespace=NAMESPACE),
        spec=client.V1LeaseSpec(
            holder_identity=POD_NAME,
            lease_duration_seconds=LEASE_DURATION,
            acquire_time=now,
            renew_time=now,
        ),
    )
    try:
        coord.create_namespaced_lease(namespace=NAMESPACE, body=body)
        logger.info("Successfully created lease resource and claimed leadership.")
        return True
    except ApiException as e:
        if e.status == 409:  # Lost the race — another pod created it simultaneously
            logger.warning("Failed to create lease: race condition met (409 Conflict).")
            return False
        raise

def _renew_lease(lease: client.V1Lease) -> bool:
    """Renew an existing lease using atomic optimistic concurrency control."""
    now = datetime.datetime.now(datetime.UTC)
    lease.spec.renew_time = now
    lease.spec.holder_identity = POD_NAME
    lease.spec.lease_duration_seconds = LEASE_DURATION
    
    try:
        # Keeping the original lease object preserves 'metadata.resourceVersion',
        # which forces K8s to reject this update with a 409 if another pod wrote first.
        coord.replace_namespaced_lease(name=LEASE_NAME, namespace=NAMESPACE, body=lease)
        logger.debug("Lease successfully extended.")
        return True
    except ApiException as e:
        if e.status == 409:
            logger.warning("Lost lease renewal lock due to an optimistic concurrency conflict (409).")
            return False
        logger.error("API error attempting lease renewal (Status %s): %s", e.status, e.body)
        return False

def _is_expired(lease: client.V1Lease) -> bool:
    """Assess if the active lease holder has drifted beyond the allowed TTL window."""
    renew_time = lease.spec.renew_time
    if not renew_time:
        return True
    
    now = datetime.datetime.now(datetime.UTC)
    # Ensure standard datetime comparison even if the K8s SDK returns a string pattern
    if isinstance(renew_time, str):
        renew_dt = datetime.datetime.strptime(renew_time, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)
    else:
        renew_dt = renew_time

    age = (now - renew_dt).total_seconds()
    ttl = lease.spec.lease_duration_seconds or LEASE_DURATION
    return age > ttl

# ---------------------------------------------------------------------------
# Core Pod State Mutation
# ---------------------------------------------------------------------------

def patch_label(value: str | None):
    """Safely apply or remove the target role label on this running pod descriptor."""
    body = {"metadata": {"labels": {LABEL_KEY: value}}}
    try:
        core.patch_namespaced_pod(POD_NAME, NAMESPACE, body)
        logger.info("Pod label adjusted to: '%s=%s'", LABEL_KEY, value)
    except ApiException as e:
        logger.error("Failed to patch pod labels (Status %s): %s", e.status, e.body)

# ---------------------------------------------------------------------------
# Execution Engine Loop
# ---------------------------------------------------------------------------

def run():
    logger.info("Starting Redis leader election loop. Watching: '%s'", LEASE_NAME)
    is_primary = False

    while True:
        try:
            lease = _get_lease()

            # Case A: Lease doesn't exist (e.g. manual delete or initial deployment)
            if lease is None:
                logger.info("Lease missing. Initiating rapid recovery/creation sequence.")
                if _create_lease():
                    if not is_primary:
                        logger.info(">>> LEADERSHIP ACQUIRED: Transitioning to primary <<<")
                        patch_label(LABEL_PRIMARY)
                        is_primary = True
                else:
                    if is_primary:
                        logger.warning("<<< LEADERSHIP LOST: Stepdown triggered by failed creation race >>>")
                        patch_label(None)
                        is_primary = False

            # Case B: We currently hold the lease
            elif lease.spec.holder_identity == POD_NAME:
                if _renew_lease(lease):
                    if not is_primary:
                        logger.info(">>> LEADERSHIP CLAIMED: Re-labeling pod to primary <<<")
                        patch_label(LABEL_PRIMARY)
                        is_primary = True
                else:
                    if is_primary:
                        logger.warning("<<< LEADERSHIP LOST: Stepdown triggered by renewal collision >>>")
                        patch_label(None)
                        is_primary = False

            # Case C: Lease exists but has expired (Previous holder dropped off)
            elif _is_expired(lease):
                logger.info("Lease held by '%s' has expired. Executing takeover protocol.", lease.spec.holder_identity)
                lease.spec.holder_identity = POD_NAME
                lease.spec.acquire_time = datetime.datetime.now(datetime.UTC)
                
                if _renew_lease(lease):
                    logger.info(">>> TAKEOVER SUCCESSFUL: We are the new primary leader <<<")
                    patch_label(LABEL_PRIMARY)
                    is_primary = True
                else:
                    if is_primary:
                        logger.warning("<<< TAKEOVER FAILED: Backing down to standby status >>>")
                        patch_label(None)
                        is_primary = False

            # Case D: Another pod holds a totally valid, unexpired lease
            else:
                logger.debug("Lease held securely by '%s'. Waiting patiently...", lease.spec.holder_identity)
                if is_primary:
                    logger.warning("<<< LEADERSHIP OVERWRITTEN: Stepping down immediately <<<")
                    patch_label(None)
                    is_primary = False

        except Exception as loop_error:
            logger.error("Unexpected failure inside execution loop framework: %s", loop_error, exc_info=True)
            if is_primary:
                logger.warning("Emergency circuit breaker triggered: Stripping labels due to persistent engine exceptions.")
                try:
                    patch_label(None)
                except Exception as safety_err:
                    logger.critical("Failed to drop labels during emergency containment: %s", safety_err)
                is_primary = False

        # Sleep conditionally: Standby pods poll slightly faster to maintain high availability
        time.sleep(RENEW_INTERVAL if is_primary else RETRY_INTERVAL)

if __name__ == "__main__":
    run()