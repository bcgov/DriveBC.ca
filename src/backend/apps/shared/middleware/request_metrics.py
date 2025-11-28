import time
import logging
from django.db import connection

logger = logging.getLogger(__name__)

class RequestMetricsMiddleware:
    """
    Logs per-request latency and DB query stats. Safe for prod when sampling.
    Set SAMPLE_RATE to 1.0 to log every request, or lower to sample.
    """
    SAMPLE_RATE = 1.0  

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import random
        if random.random() > self.SAMPLE_RATE:
            return self.get_response(request)

        # Enable query logging for this sampled request even when DEBUG=False
        prev_force_debug = connection.force_debug_cursor
        connection.force_debug_cursor = True
        start = time.perf_counter()
        num_queries_before = len(connection.queries)

        try:
            response = self.get_response(request)
        finally:
            # Restore prior setting to avoid global impact
            connection.force_debug_cursor = prev_force_debug

        duration_ms = (time.perf_counter() - start) * 1000
        queries = connection.queries[num_queries_before:]
        query_count = len(queries)
        total_query_ms = sum(float(q.get("time", 0)) * 1000 for q in queries)

        logger.info(
            "request_metrics path=%s status=%s dur_ms=%.1f queries=%s query_ms=%.1f",
            request.path,
            getattr(response, "status_code", "n/a"),
            duration_ms,
            query_count,
            total_query_ms,
        )
        return response
