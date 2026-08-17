#!/usr/bin/env python3
"""
Redis primary election via a Kubernetes Lease, plain HTTP version.

Talks directly to the coordination.k8s.io/v1 Lease API and the core Pod API
(for the role label patch) using only the standard library — no
kubernetes-client dependency needed for three call types (GET/POST/PUT a
Lease, PATCH a Pod's labels).

Required env vars (injected via the Downward API):
  POD_NAME        - metadata.name of this pod
  POD_NAMESPACE   - metadata.namespace of this pod

Optional env vars:
  LEASE_NAME      - name of the Lease object (default: redis-primary)
  LEASE_DURATION  - seconds a leader holds the lease (default: 15)
  RENEW_INTERVAL  - seconds between renewal attempts while leading (default: 5)
  RETRY_INTERVAL  - seconds standbys wait between acquire attempts (default: 10)
  K8S_API_SERVER  - override API server base URL for local dev, e.g. run
                     `kubectl proxy` and set K8S_API_SERVER=http://localhost:8001
                     (no token/TLS needed — the proxy handles auth for you)
"""

import http.client
import json
import logging
import os
import ssl
import time
from datetime import datetime, timezone
from urllib.parse import urlsplit

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
RETRY_INTERVAL = int(os.environ.get("RETRY_INTERVAL", "10"))

SA_DIR     = "/var/run/secrets/kubernetes.io/serviceaccount"
TOKEN_PATH = f"{SA_DIR}/token"
CA_PATH    = f"{SA_DIR}/ca.crt"

LEASE_PATH            = f"/apis/coordination.k8s.io/v1/namespaces/{NAMESPACE}/leases/{LEASE_NAME}"
LEASE_COLLECTION_PATH = f"/apis/coordination.k8s.io/v1/namespaces/{NAMESPACE}/leases"
POD_PATH               = f"/api/v1/namespaces/{NAMESPACE}/pods/{POD_NAME}"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logging.getLogger().handlers[0].setFormatter(
    logging.Formatter(f"%(asctime)s [%(levelname)s] [{POD_NAME}] %(message)s")
)

# ---------------------------------------------------------------------------
# Minimal Kubernetes API client (stdlib only)
# ---------------------------------------------------------------------------

class ApiError(Exception):
    def __init__(self, status: int, reason: str, body: str = ""):
        self.status = status
        self.reason = reason
        self.body = body
        super().__init__(f"{status} {reason}: {body}")


class K8sClient:
    """Tiny HTTP client, reusing one persistent connection instead of paying
    a fresh TCP+TLS handshake on every poll."""

    def __init__(self):
        in_cluster = os.path.exists(TOKEN_PATH)
        override = os.environ.get("K8S_API_SERVER")

        if override:
            parts = urlsplit(override)
            self._host = parts.hostname
            self._port = parts.port or (443 if parts.scheme == "https" else 80)
            self._https = parts.scheme == "https"
            self._token = None
            self._ssl_context = ssl.create_default_context() if self._https else None
            logger.warning("Using K8S_API_SERVER override (%s) — dev mode", override)
        elif in_cluster:
            self._host = os.environ["KUBERNETES_SERVICE_HOST"]
            self._port = int(os.environ["KUBERNETES_SERVICE_PORT"])
            self._https = True
            with open(TOKEN_PATH) as f:
                self._token = f.read().strip()
            self._ssl_context = ssl.create_default_context(cafile=CA_PATH)
            logger.info("Loaded in-cluster service account credentials")
        else:
            raise RuntimeError(
                "Not running in-cluster and no K8S_API_SERVER override set. "
                "For local dev, run `kubectl proxy` and set "
                "K8S_API_SERVER=http://localhost:8001"
            )

        self._conn: http.client.HTTPConnection | None = None

    def _connect(self):
        if self._https:
            self._conn = http.client.HTTPSConnection(
                self._host, self._port, context=self._ssl_context, timeout=10
            )
        else:
            self._conn = http.client.HTTPConnection(self._host, self._port, timeout=10)

    def request(self, method: str, path: str, body: dict | None = None,
                content_type: str = "application/json") -> dict | None:
        """Issue one API call, reusing the persistent connection when possible.
        Reconnects once on a dead/broken connection before giving up."""
        payload = json.dumps(body).encode() if body is not None else None
        headers = {"Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = content_type
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"

        for attempt in (1, 2):
            if self._conn is None:
                self._connect()
            try:
                self._conn.request(method, path, body=payload, headers=headers)
                resp = self._conn.getresponse()
                data = resp.read()
            except (http.client.HTTPException, OSError) as e:
                logger.warning("Connection error (%s) — reconnecting", e)
                self._conn = None
                if attempt == 2:
                    raise
                continue

            result = json.loads(data) if (data and resp.status != 204) else None

            if resp.status >= 400:
                reason = resp.reason
                if isinstance(result, dict) and "message" in result:
                    reason = result["message"]
                raise ApiError(resp.status, reason, data.decode(errors="replace"))

            return result

        raise RuntimeError("unreachable")


_client: K8sClient | None = None


def _api() -> K8sClient:
    global _client
    if _client is None:
        _client = K8sClient()
    return _client

# ---------------------------------------------------------------------------
# K8s Lease API Helpers
# ---------------------------------------------------------------------------

def _now_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def _get_lease() -> dict | None:
    """Safely fetch the lease object. Returns None if it doesn't exist."""
    try:
        return _api().request("GET", LEASE_PATH)
    except ApiError as e:
        if e.status == 404:
            return None
        raise


def _lease_body(resource_version: str | None = None, acquire_time: str | None = None) -> dict:
    now = _now_str()
    metadata = {"name": LEASE_NAME, "namespace": NAMESPACE}
    if resource_version:
        metadata["resourceVersion"] = resource_version
    return {
        "apiVersion": "coordination.k8s.io/v1",
        "kind": "Lease",
        "metadata": metadata,
        "spec": {
            "holderIdentity": POD_NAME,
            "leaseDurationSeconds": LEASE_DURATION,
            "acquireTime": acquire_time or now,
            "renewTime": now,
        },
    }


def _create_lease() -> bool:
    """Attempt to create the lease object from scratch. Handles 409 conflicts."""
    try:
        _api().request("POST", LEASE_COLLECTION_PATH, body=_lease_body())
        logger.info("Successfully created lease resource and claimed leadership.")
        return True
    except ApiError as e:
        if e.status == 409:  # Lost the race — another pod created it simultaneously
            logger.warning("Failed to create lease: race condition met (409 Conflict).")
            return False
        raise


def _renew_lease(lease: dict, new_acquire_time: str | None = None) -> bool:
    """Renew (or take over) a lease using atomic optimistic concurrency control.
    Passing the fetched lease's resourceVersion forces K8s to reject this
    update with a 409 if another pod wrote first."""
    body = _lease_body(
        resource_version=lease["metadata"]["resourceVersion"],
        acquire_time=new_acquire_time or lease["spec"].get("acquireTime"),
    )
    try:
        _api().request("PUT", LEASE_PATH, body=body)
        logger.debug("Lease successfully extended.")
        return True
    except ApiError as e:
        if e.status == 409:
            logger.warning("Lost lease renewal lock due to an optimistic concurrency conflict (409).")
            return False
        logger.error("API error attempting lease renewal (Status %s): %s", e.status, e.body)
        return False


def _is_expired(lease: dict) -> bool:
    """Assess if the active lease holder has drifted beyond the allowed TTL window."""
    renew_time = lease["spec"].get("renewTime")
    if not renew_time:
        return True

    renew_dt = datetime.fromisoformat(renew_time.replace("Z", "+00:00"))
    age = (datetime.now(timezone.utc) - renew_dt).total_seconds()
    ttl = lease["spec"].get("leaseDurationSeconds") or LEASE_DURATION
    return age > ttl

# ---------------------------------------------------------------------------
# Core Pod State Mutation
# ---------------------------------------------------------------------------

def patch_label(value: str | None):
    """Safely apply or remove the target role label on this running pod
    descriptor. A JSON merge patch (RFC 7396) with a null value deletes the
    key, matching the old strategic-merge-patch behavior for a plain map."""
    body = {"metadata": {"labels": {LABEL_KEY: value}}}
    try:
        _api().request("PATCH", POD_PATH, body=body, content_type="application/merge-patch+json")
        logger.info("Pod label adjusted to: '%s=%s'", LABEL_KEY, value)
    except ApiError as e:
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
            elif lease["spec"].get("holderIdentity") == POD_NAME:
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
                logger.info(
                    "Lease held by '%s' has expired. Executing takeover protocol.",
                    lease["spec"].get("holderIdentity"),
                )
                if _renew_lease(lease, new_acquire_time=_now_str()):
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
                logger.debug("Lease held securely by '%s'. Waiting patiently...", lease["spec"].get("holderIdentity"))
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

        # Sleep conditionally: standby pods retry at RETRY_INTERVAL, leaders renew at RENEW_INTERVAL
        time.sleep(RENEW_INTERVAL if is_primary else RETRY_INTERVAL)


if __name__ == "__main__":
    run()