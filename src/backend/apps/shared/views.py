import re

from django.contrib.gis.geos import LineString, Point
from django.contrib.gis.measure import D

from apps.shared.enums import CacheKey, CacheTimeout, ROUTE_FILTER_TOLERANCE
from django.core.cache import cache
from django.db import connection
from django.urls import re_path
from django.views.static import serve
from rest_framework.response import Response
from rest_framework.views import APIView


class CachedListModelMixin:
    """
    List a queryset. Result is fetched from cache or updates it if it doesn't exist.
    """
    cache_key = CacheKey.DEFAULT
    cache_timeout = CacheTimeout.DEFAULT

    def fetch_list_data(self, queryset=None):
        serializer = self.serializer_class(queryset.all() if queryset is not None else self.queryset.all(), many=True)
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
        route = request.query_params.get('route')
        if not route:
            return Response(self.get_or_set_list_data())

        return Response(
            self.fetch_list_data(
                self.get_filtered_queryset(route)
            )
        )

    def get_filtered_queryset(self, geo_filter):
        # TODO: error handling and unit tests
        coords_list = geo_filter.split(',')
        points_list = []
        for i in range(0, len(coords_list), 2):
            points_list.append(Point(float(coords_list[i]), float(coords_list[i + 1])))

        derp = self.queryset.filter(
            location__distance_lte=(LineString(points_list), D(m=ROUTE_FILTER_TOLERANCE))
        )
        return derp


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


# TO BE REMOVED IN PRODUCTION
def static_override(prefix, view=serve, **kwargs):
    return [
        re_path(
            r"^%s(?P<path>.*)$" % re.escape(prefix.lstrip("/")), view, kwargs=kwargs
        ),
    ]
