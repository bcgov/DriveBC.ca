import re
from pathlib import Path

import environ
import requests
from apps.shared.enums import (
    ROUTE_FILTER_TOLERANCE,
    SUBJECT_CHOICES,
    CacheKey,
    CacheTimeout,
)
from django.contrib.gis.geos import LineString, Point
from django.contrib.gis.measure import D
from django.core.cache import cache
from django.core.mail import send_mail
from django.db import connection
from django.urls import re_path
from django.views.static import serve
from drf_recaptcha.fields import ReCaptchaV3Field
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.serializers import Serializer
from rest_framework.views import APIView

# Base dir and env
BASE_DIR = Path(__file__).resolve().parents[4]
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env', overwrite=True)


class FeedbackSerializer(Serializer):
    email = serializers.EmailField()
    message = serializers.CharField(min_length=10, max_length=500)
    subject = serializers.ChoiceField(choices=SUBJECT_CHOICES)
    recToken = ReCaptchaV3Field(
        action="feedbackForm",
        required_score=0.6,
    )


class FeedbackView(APIView):
    def post(self, request):
        serializer = FeedbackSerializer(data=request.data, context={"request": request})

        try:
            serializer.is_valid()

            # Currently unused but potentially important data
            # score = serializer.fields['recToken'].score
            # subject = serializer.data['subject']

            send_mail(
                "DriveBC Feedback message",
                serializer.data['message'],
                serializer.data['email'],
                [env("DRIVEBC_FEEDBACK_EMAIL_DEFAULT")],
                fail_silently=False,
            )

            return Response(data={}, status=status.HTTP_200_OK)

        except Exception:
            return Response(data={}, status=status.HTTP_400_BAD_REQUEST)


class CachedListModelMixin:
    """
    List a queryset. Result is fetched from cache or updates it if it doesn't exist.
    """
    cache_key = CacheKey.DEFAULT
    cache_timeout = CacheTimeout.DEFAULT

    def fetch_list_data(self, queryset=None):
        qs = queryset.all() if queryset is not None else self.queryset.all()

        # Use get_serializer for FE api to build URLs from self.request
        serializer = self.get_serializer(qs, many=True) \
            if hasattr(self, "request") else self.serializer_class(qs, many=True)

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
        payload = {
            "points": geo_filter,
        }

        # DBC22:1201
        # Fetch route from API again to avoid sending too many coordinates from client
        # To be removed once we have route saved in backend
        response = requests.get(
            env("DRIVEBC_ROUTE_PLANNER_API_BASE_URL") + "/directions.json",
            params=payload,
            headers={
                "apiKey": env("DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY"),
            }
        )

        points_list = [Point(p) for p in response.json()['route']]
        res = self.queryset.filter(
            location__distance_lte=(
                LineString(points_list), D(m=ROUTE_FILTER_TOLERANCE)
            )
        )
        return res


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
