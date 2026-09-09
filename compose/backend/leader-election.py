#!/usr/bin/env python3
"""
Kubernetes leader-election wrapper for Huey.

Uses the coordination.k8s.io/v1 Lease API directly, since the Python
kubernetes client does not ship a LeaseLock class (only ConfigMapLock).

Only the pod currently holding the Lease will run `manage.py run_huey`.
If that pod dies or fails to renew, the standby acquires the Lease
and starts Huey automatically.

While leading, also watches Django's Redis `last_task_execution` cache key.
If tasks stop updating it (Huey hung), this process exits so Kubernetes
restarts the pod / the standby can take over. Standbys never run this check.

Required env vars (injected via the Downward API):
  POD_NAME        - metadata.name of this pod
  POD_NAMESPACE   - metadata.namespace of this pod

Optional env vars:
  LEASE_NAME               - name of the Lease object (default: huey-leader)
  LEASE_DURATION           - seconds a leader holds the lease (default: 15)
  RENEW_INTERVAL           - seconds between renewal attempts while leading (default: 5)
  RETRY_INTERVAL           - seconds standbys wait between acquire attempts (default: 3)
  REDIS_HOST               - Redis host for last_task_execution (default: localhost)
  REDIS_PORT               - Redis port (default: 6379)
  TASK_STALE_SECONDS       - max age of last_task_execution before hang (default: 300)
  TASK_HEALTH_GRACE_SECONDS - skip hang check this long after Huey start (default: 120)
"""

import logging
import os
import pickle
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone

import redis
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

POD_NAME = os.environ["POD_NAME"]
POD_NAMESPACE = os.environ["POD_NAMESPACE"]
LEASE_NAME = os.environ.get("LEASE_NAME", "huey-leader")
LEASE_DURATION = int(os.environ.get("LEASE_DURATION", "15"))
RENEW_INTERVAL = int(os.environ.get("RENEW_INTERVAL", "5"))
RETRY_INTERVAL = int(os.environ.get("RETRY_INTERVAL", "3"))

REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))
TASK_STALE_SECONDS = int(os.environ.get("TASK_STALE_SECONDS", "300"))
TASK_HEALTH_GRACE_SECONDS = int(os.environ.get("TASK_HEALTH_GRACE_SECONDS", "120"))

# Django default cache key: default_key_func("last_task_execution", "", 1)
DJANGO_CACHE_KEY = ":1:last_task_execution"

huey_process: subprocess.Popen | None = None
huey_started_at: float | None = None
_redis_client: redis.Redis | None = None


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
        ts = renew_time.replace('Z', '+00:00')
        renew_dt = datetime.fromisoformat(ts)
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
    global huey_process, huey_started_at
    logger.info("Leadership acquired — starting Huey")
    huey_process = subprocess.Popen(
        ["python", "manage.py", "run_huey"],
        stdout=sys.stdout,
        stderr=sys.stderr,
        cwd="/app/backend",
    )
    huey_started_at = time.monotonic()
    logger.info("Huey running (PID %d)", huey_process.pid)


def _stop_huey(timeout: int = 30):
    global huey_process, huey_started_at
    if huey_process is None or huey_process.poll() is not None:
        huey_process = None
        huey_started_at = None
        return
    logger.info("Sending SIGTERM to Huey (PID %d)", huey_process.pid)
    huey_process.terminate()
    try:
        huey_process.wait(timeout=timeout)
        logger.info("Huey stopped cleanly")
    except subprocess.TimeoutExpired:
        logger.warning("Huey did not stop within %ds — sending SIGKILL", timeout)
        huey_process.kill()
    huey_process = None
    huey_started_at = None


def _huey_alive() -> bool:
    return huey_process is not None and huey_process.poll() is None


def _handle_os_signal(signum, _frame):
    logger.info("Received signal %d — shutting down", signum)
    _stop_huey()
    os._exit(0)


# ---------------------------------------------------------------------------
# Hang detection (leader only)
# ---------------------------------------------------------------------------

def _get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    return _redis_client


def _tasks_appear_hung() -> bool:
    try:
        raw = _get_redis().get(DJANGO_CACHE_KEY)
    except redis.RedisError as e:
        logger.warning("Could not read last_task_execution from Redis: %s", e)
        return False

    if raw is None:
        logger.warning("last_task_execution cache key is missing")
        return True

    try:
        last = pickle.loads(raw)
    except Exception as e:
        logger.warning("Could not decode last_task_execution: %s", e)
        return False

    # Standardize to UTC for aware or naive objects
    now = datetime.now(timezone.utc)
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    else:
        last = last.astimezone(timezone.utc)

    age = (now - last).total_seconds()

    if age < 0:  # Ignore minor clock skew
        return False

    if age > TASK_STALE_SECONDS:
        logger.error(
            "last_task_execution is stale (%.0fs old, threshold %ds)",
            age,
            TASK_STALE_SECONDS,
        )
        return True
    return False


def _check_huey_progress():
    """Exit if Huey has been up past the grace window but tasks look hung."""
    if huey_started_at is None:
        return
    if (time.monotonic() - huey_started_at) < TASK_HEALTH_GRACE_SECONDS:
        return
    if _tasks_appear_hung():
        logger.error(
            "Huey tasks appear hung — terminating so Kubernetes can restart "
            "and the standby can take over"
        )
        _stop_huey()
        os._exit(1)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def main():
    signal.signal(signal.SIGTERM, _handle_os_signal)
    signal.signal(signal.SIGINT, _handle_os_signal)

    configuration = client.Configuration()
    try:
        config.load_incluster_config(client_configuration=configuration)
        logger.info("Successfully loaded in-cluster Kubernetes configuration.")
    except config.ConfigException:
        logger.warning("Not in-cluster — falling back to local kubeconfig (dev mode)")
        config.load_kube_config(client_configuration=configuration)

    api_client = client.ApiClient(configuration=configuration)
    api = client.CoordinationV1Api(api_client=api_client)
    leading = False

    logger.info(
        "Starting leader election | lease=%s namespace=%s identity=%s "
        "task_stale=%ds grace=%ds",
        LEASE_NAME, POD_NAMESPACE, POD_NAME,
        TASK_STALE_SECONDS, TASK_HEALTH_GRACE_SECONDS,
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
                    if huey_process is None:
                        # We hold the lease (e.g. after a container restart)
                        # but haven't started the process yet.
                        logger.info("Already hold lease after restart — starting Huey")
                        leading = True
                        _start_huey()
                    elif not _huey_alive():
                        # Huey was running, but now it's not.
                        logger.error("Huey exited unexpectedly — terminating container so it restarts")
                        os._exit(1)
                    else:
                        _check_huey_progress()

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