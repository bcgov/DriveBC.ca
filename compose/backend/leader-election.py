#!/usr/bin/env python3
"""
Kubernetes leader-election wrapper for Huey — plain HTTP version.

Talks directly to the coordination.k8s.io/v1 Lease API over a persistent
HTTPS connection using only the standard library. We only ever need three
calls (GET / POST / PUT one Lease object), so pulling in the full generated
kubernetes-client (its swagger model layer, watch machinery, and its own
connection-pool overhead) is not worth it. There also seems to be a memory leak
in that client.

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
  RETRY_INTERVAL  - seconds standbys wait between acquire attempts (default: 10)
  K8S_API_SERVER  - override API server base URL for local dev, e.g. run
                     `kubectl proxy` and set K8S_API_SERVER=http://localhost:8001
                     (no token/TLS needed — the proxy handles auth for you)
"""

import http.client
import json
import logging
import os
import signal
import ssl
import subprocess
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urlsplit

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
RETRY_INTERVAL = int(os.environ.get("RETRY_INTERVAL", "10"))

SA_DIR     = "/var/run/secrets/kubernetes.io/serviceaccount"
TOKEN_PATH = f"{SA_DIR}/token"
CA_PATH    = f"{SA_DIR}/ca.crt"

LEASE_PATH            = f"/apis/coordination.k8s.io/v1/namespaces/{POD_NAMESPACE}/leases/{LEASE_NAME}"
LEASE_COLLECTION_PATH = f"/apis/coordination.k8s.io/v1/namespaces/{POD_NAMESPACE}/leases"

huey_process: subprocess.Popen | None = None


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
    """Tiny HTTP client for the Lease API, reusing one persistent connection
    instead of paying a fresh TCP+TLS handshake on every poll."""

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

    def request(self, method: str, path: str, body: dict | None = None) -> dict | None:
        """Issue one API call, reusing the persistent connection when possible.
        Reconnects once on a dead/broken connection before giving up."""
        payload = json.dumps(body).encode() if body is not None else None
        headers = {"Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
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
# Lease helpers
# ---------------------------------------------------------------------------

def _now_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def _get_lease() -> dict | None:
    try:
        return _api().request("GET", LEASE_PATH)
    except ApiError as e:
        if e.status == 404:
            return None
        raise


def _lease_body(resource_version: str | None = None, acquire_time: str | None = None) -> dict:
    now = _now_str()
    metadata = {"name": LEASE_NAME, "namespace": POD_NAMESPACE}
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
    try:
        _api().request("POST", LEASE_COLLECTION_PATH, body=_lease_body())
        logger.info("Created lease, we are the leader: %s", POD_NAME)
        return True
    except ApiError as e:
        if e.status == 409:  # already exists — race, someone else won
            return False
        raise


def _renew_lease(lease: dict) -> bool:
    """PUT the lease back with a fresh renewTime, using its resourceVersion
    for optimistic concurrency — a conflict here means we lost the lease."""
    body = _lease_body(
        resource_version=lease["metadata"]["resourceVersion"],
        acquire_time=lease["spec"].get("acquireTime"),
    )
    try:
        _api().request("PUT", LEASE_PATH, body=body)
        return True
    except ApiError as e:
        logger.warning("Failed to renew lease: %s", e)
        return False


def _takeover_lease(lease: dict) -> bool:
    body = _lease_body(resource_version=lease["metadata"]["resourceVersion"])
    try:
        _api().request("PUT", LEASE_PATH, body=body)
        return True
    except ApiError as e:
        logger.warning("Takeover failed (lost race?): %s", e)
        return False


def _is_expired(lease: dict) -> bool:
    renew_time = lease["spec"].get("renewTime")
    if renew_time is None:
        return True
    renew_dt = datetime.fromisoformat(renew_time.replace("Z", "+00:00"))
    age = (datetime.now(timezone.utc) - renew_dt).total_seconds()
    return age > LEASE_DURATION


def _i_hold_lease(lease: dict) -> bool:
    return lease["spec"].get("holderIdentity") == POD_NAME

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

    leading = False

    logger.info(
        "Starting leader election | lease=%s namespace=%s identity=%s",
        LEASE_NAME, POD_NAMESPACE, POD_NAME,
    )

    while True:
        try:
            lease = _get_lease()

            if lease is None:
                if _create_lease():
                    leading = True
                    _start_huey()

            elif _i_hold_lease(lease):
                if not _renew_lease(lease):
                    logger.error("Lost lease renewal — stopping Huey and yielding")
                    _stop_huey()
                    leading = False
                else:
                    if huey_process is None:
                        logger.info("Already hold lease after restart — starting Huey")
                        leading = True 
                        _start_huey()
                    elif not _huey_alive():
                        logger.error("Huey exited unexpectedly — terminating container so it restarts")
                        os._exit(1)

            elif _is_expired(lease):
                logger.info(
                    "Lease held by %s has expired — attempting takeover",
                    lease["spec"].get("holderIdentity"),
                )
                if _takeover_lease(lease):
                    logger.info("Takeover successful — we are the new leader")
                    leading = True
                    _start_huey()

            else:
                logger.debug("Lease held by %s, waiting…", lease["spec"].get("holderIdentity")) # set to debug to reduce log clutter
                if leading:
                    logger.warning("We lost the lease unexpectedly — stopping Huey")
                    _stop_huey()
                    leading = False

        except Exception as e:
            logger.error("Unexpected error in election loop: %s", e, exc_info=True)

        time.sleep(RENEW_INTERVAL if leading else RETRY_INTERVAL)


if __name__ == "__main__":
    main()