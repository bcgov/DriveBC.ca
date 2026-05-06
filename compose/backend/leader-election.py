#!/usr/bin/env python3
"""
Kubernetes leader-election wrapper for Huey.

Uses the coordination.k8s.io/v1 Lease API directly, since the Python
kubernetes client does not ship a LeaseLock class (only ConfigMapLock).

Only the pod currently holding the Lease will run `manage.py run_huey`.
If that pod dies or fails to renew, the standby acquires the Lease
and starts Huey automatically.

Required env vars (injected via the Downward API):
  POD_NAME        - metadata.name of this pod
  POD_NAMESPACE   - metadata.namespace of this pod

Optional env vars:
  LEASE_NAME      - name of the Lease object (default: huey-leader)
  LEASE_DURATION  - seconds a leader holds the lease (default: 15)
  RENEW_INTERVAL  - seconds between renewal attempts while leading (default: 5)
  RETRY_INTERVAL  - seconds standbys wait between acquire attempts (default: 3)
"""

import logging
import os
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone

from kubernetes import client, config
from kubernetes.client.rest import ApiException

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

POD_NAME       = os.environ["POD_NAME"]
POD_NAMESPACE  = os.environ["POD_NAMESPACE"]
LEASE_NAME     = os.environ.get("LEASE_NAME", "huey-leader")
LEASE_DURATION = int(os.environ.get("LEASE_DURATION", "15"))
RENEW_INTERVAL = int(os.environ.get("RENEW_INTERVAL", "5"))
RETRY_INTERVAL = int(os.environ.get("RETRY_INTERVAL", "3"))

huey_process: subprocess.Popen | None = None

# ---------------------------------------------------------------------------
# Lease helpers
# ---------------------------------------------------------------------------

def _now_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def _get_lease(api: client.CoordinationV1Api):
    try:
        return api.read_namespaced_lease(name=LEASE_NAME, namespace=POD_NAMESPACE)
    except ApiException as e:
        if e.status == 404:
            return None
        raise


def _create_lease(api: client.CoordinationV1Api) -> bool:
    now = _now_str()
    body = client.V1Lease(
        metadata=client.V1ObjectMeta(name=LEASE_NAME, namespace=POD_NAMESPACE),
        spec=client.V1LeaseSpec(
            holder_identity=POD_NAME,
            lease_duration_seconds=LEASE_DURATION,
            acquire_time=now,
            renew_time=now,
        ),
    )
    try:
        api.create_namespaced_lease(namespace=POD_NAMESPACE, body=body)
        logger.info("Created lease, we are the leader: %s", POD_NAME)
        return True
    except ApiException as e:
        if e.status == 409:  # already exists — race, someone else won
            return False
        raise


def _renew_lease(api: client.CoordinationV1Api, lease) -> bool:
    """Update renewTime on the existing lease object."""
    lease.spec.renew_time = _now_str()
    lease.spec.holder_identity = POD_NAME
    lease.spec.lease_duration_seconds = LEASE_DURATION
    try:
        api.replace_namespaced_lease(name=LEASE_NAME, namespace=POD_NAMESPACE, body=lease)
        return True
    except ApiException as e:
        logger.warning("Failed to renew lease: %s", e)
        return False


def _is_expired(lease) -> bool:
    renew_time = lease.spec.renew_time
    if renew_time is None:
        return True
    if isinstance(renew_time, str):
        renew_dt = datetime.strptime(renew_time, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    else:
        renew_dt = renew_time  # already a datetime
    age = (datetime.now(timezone.utc) - renew_dt).total_seconds()
    return age > LEASE_DURATION


def _i_hold_lease(lease) -> bool:
    return lease.spec.holder_identity == POD_NAME

# ---------------------------------------------------------------------------
# Huey process management
# ---------------------------------------------------------------------------

def _start_huey():
    global huey_process
    logger.info("Leadership acquired — starting Huey")
    huey_process = subprocess.Popen(
        ["python", "manage.py", "run_huey"],
        stdout=sys.stdout,
        stderr=sys.stderr,
        cwd="/app/backend",
    )
    logger.info("Huey running (PID %d)", huey_process.pid)


def _stop_huey(timeout: int = 30):
    global huey_process
    if huey_process is None or huey_process.poll() is not None:
        return
    logger.info("Sending SIGTERM to Huey (PID %d)", huey_process.pid)
    huey_process.terminate()
    try:
        huey_process.wait(timeout=timeout)
        logger.info("Huey stopped cleanly")
    except subprocess.TimeoutExpired:
        logger.warning("Huey did not stop within %ds — sending SIGKILL", timeout)
        huey_process.kill()


def _huey_alive() -> bool:
    return huey_process is not None and huey_process.poll() is None


def _handle_os_signal(signum, _frame):
    logger.info("Received signal %d — shutting down", signum)
    _stop_huey()
    os._exit(0)

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def main():
    signal.signal(signal.SIGTERM, _handle_os_signal)
    signal.signal(signal.SIGINT, _handle_os_signal)

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
    api = client.CoordinationV1Api(api_client=api_client)
    leading = False

    logger.info(
        "Starting leader election | lease=%s namespace=%s identity=%s",
        LEASE_NAME, POD_NAMESPACE, POD_NAME,
    )

    while True:
        try:
            lease = _get_lease(api)

            if lease is None:
                # No lease exists yet — race to create it
                if _create_lease(api):
                    leading = True
                    _start_huey()

            elif _i_hold_lease(lease):
                # We are the current leader — renew
                if not _renew_lease(api, lease):
                    logger.error("Lost lease renewal — stopping Huey and yielding")
                    _stop_huey()
                    leading = False
                else:
                    # Check Huey is still up; if it died, exit so the pod restarts
                    if not _huey_alive():
                        logger.error("Huey exited unexpectedly — terminating pod so it restarts")
                        os._exit(1)

            elif _is_expired(lease):
                # Previous leader's lease has expired — take over
                logger.info(
                    "Lease held by %s has expired — attempting takeover",
                    lease.spec.holder_identity,
                )
                lease.spec.holder_identity = POD_NAME
                lease.spec.acquire_time = _now_str()
                lease.spec.renew_time = _now_str()
                lease.spec.lease_duration_seconds = LEASE_DURATION
                try:
                    api.replace_namespaced_lease(
                        name=LEASE_NAME, namespace=POD_NAMESPACE, body=lease
                    )
                    logger.info("Takeover successful — we are the new leader")
                    leading = True
                    _start_huey()
                except ApiException as e:
                    logger.warning("Takeover failed (lost race?): %s", e)

            else:
                # Another pod holds a valid lease — stand by
                logger.info(
                    "Lease held by %s, waiting…", lease.spec.holder_identity
                )
                if leading:
                    # Shouldn't normally happen, but clean up if it does
                    logger.warning("We lost the lease unexpectedly — stopping Huey")
                    _stop_huey()
                    leading = False

        except Exception as e:
            logger.error("Unexpected error in election loop: %s", e, exc_info=True)

        time.sleep(RENEW_INTERVAL if leading else RETRY_INTERVAL)


if __name__ == "__main__":
    main()