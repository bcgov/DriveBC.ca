from django.core.cache import cache
from django.db import connection

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shared.enums import CacheKey, CacheTimeout


class CachedListModelMixin:
    """
    List a queryset. Result is fetched from cache or updates it if it doesn't exist.
    """
    cache_key = CacheKey.DEFAULT
    cache_timeout = CacheTimeout.DEFAULT

    def fetch_list_data(self):
        serializer = self.serializer_class(self.queryset.all(), many=True)
        return serializer.data

    def set_list_data(self):
        return cache.set(self.cache_key, self.fetch_list_data(), self.cache_timeout)

    def get_or_set_list_data(self):
        return cache.get_or_set(
            self.cache_key,
            self.fetch_list_data,
            self.cache_timeout
        )

    def list(self, request, *args, **kwargs):
        return Response(self.get_or_set_list_data())


class AppCacheTestViewSet(APIView):
    """
    Endpoint to allow RPS load testing combination of Django and cache
    """

    def get(self, request, format=None):
        val = cache.get(CacheKey.TEST_APP_CACHE) or 0
        val += 1
        cache.set(CacheKey.TEST_APP_CACHE, val, CacheTimeout.DEFAULT)
        return Response(val)


class AppDbTestViewSet(APIView):
    """
    Endpoint to allow RPS load testing combination of Django and db
    """

    def get(self, request, format=None):
        with connection.cursor() as cursor:
            cursor.execute("select 1").fetchone()
        return Response("1")


class AppTestViewSet(APIView):
    """
    Endpoint to allow RPS load testing of a simple Django request
    """

    def get(self, request, format=None):
        return Response("1")
