from apps.shared.enums import CacheKey, CacheTimeout
from django.core.cache import cache
from rest_framework.response import Response


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
