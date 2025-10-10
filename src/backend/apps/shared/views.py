import re

from apps.shared.enums import SUBJECT_CHOICES, SUBJECT_TITLE, CacheKey, CacheTimeout
from apps.shared.helpers import attach_default_email_images
from apps.shared.models import Area, SiteSettings
from apps.shared.serializers import DistrictViewSerializer
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import EmailMultiAlternatives
from django.db import connection
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.template.loader import render_to_string
from django.urls import re_path
from django.views.static import serve
from drf_recaptcha.fields import ReCaptchaV3Field
from rest_framework import serializers, status, viewsets
from rest_framework.response import Response
from rest_framework.serializers import Serializer
from rest_framework.views import APIView


class DeviceInfoSerializer(Serializer):
    os = serializers.CharField(max_length=100)
    browser = serializers.CharField(max_length=100)
    device = serializers.CharField(max_length=100)
    screenWidth = serializers.IntegerField()
    screenHeight = serializers.IntegerField()


class FeedbackSerializer(Serializer):
    email = serializers.EmailField()
    message = serializers.CharField(min_length=10, max_length=500)
    subject = serializers.ChoiceField(choices=SUBJECT_CHOICES)
    recToken = ReCaptchaV3Field(
        action="feedbackForm",
        required_score=0.6,
    )
    deviceInfo = DeviceInfoSerializer()


class FeedbackView(APIView):
    def post(self, request):
        serializer = FeedbackSerializer(data=request.data, context={"request": request})

        try:
            if not serializer.is_valid():
                return Response(data={}, status=status.HTTP_400_BAD_REQUEST)

            user_email = serializer.validated_data["email"]

            # For testing exception handling
            if user_email == 'test@drivebc.ca':
                return Response(data={}, status=status.HTTP_400_BAD_REQUEST)

            context = {
                "from_email": settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                "user_email": user_email,
                "message": serializer.validated_data["message"],
                "subject": SUBJECT_TITLE[serializer.validated_data["subject"]],
                "deviceInfo": serializer.validated_data["deviceInfo"],
            }

            text = render_to_string('email/user_feedback.txt', context)
            html = render_to_string('email/user_feedback.html', context)

            msg = EmailMultiAlternatives(
                'DriveBC feedback received: ' + SUBJECT_TITLE[serializer.data['subject']],
                text,
                settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                [settings.DRIVEBC_FEEDBACK_EMAIL_DEFAULT],
            )

            # image attachments
            attach_default_email_images(msg)
            msg.attach_alternative(html, 'text/html')
            msg.send()

            return Response(data={}, status=status.HTTP_200_OK)

        except Exception:
            return Response(data={}, status=status.HTTP_400_BAD_REQUEST)


class SurveySerializer(Serializer):
    email = serializers.EmailField()
    recToken = ReCaptchaV3Field(
        action="postVisitSurvey",
        required_score=0.6,
    )


class SurveyView(APIView):
    def post(self, request):
        serializer = SurveySerializer(data=request.data, context={"request": request})

        try:
            if not serializer.is_valid():
                return Response(data={}, status=status.HTTP_400_BAD_REQUEST)

            user_email = serializer.validated_data["email"]

            # For testing exception handling
            if user_email == 'test@drivebc.ca':
                return Response(data={}, status=status.HTTP_400_BAD_REQUEST)

            context = {
                "survey_link": settings.DRIVEBC_EXIT_SURVEY_LINK,
            }

            text = render_to_string('email/user_survey.txt', context)
            html = render_to_string('email/user_survey.html', context)

            msg = EmailMultiAlternatives(
                'DriveBC survey about your experience today',
                text,
                settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                [user_email],
            )

            # image attachments
            attach_default_email_images(msg)
            msg.attach_alternative(html, 'text/html')
            msg.send()

            return Response(data={}, status=status.HTTP_200_OK)

        except Exception:
            return Response(data={}, status=status.HTTP_400_BAD_REQUEST)


def health_check(response):
    return HttpResponse('Ok')


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
        site_settings = SiteSettings.objects.first()
        if site_settings:
            if site_settings.disable_apis:
                raise ImproperlyConfigured("API endpoints disabled for testing")

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


# TO BE REMOVED IN PRODUCTION
def static_override(prefix, view=serve, **kwargs):
    return [
        re_path(
            r"^%s(?P<path>.*)$" % re.escape(prefix.lstrip("/")), view, kwargs=kwargs
        ),
    ]


class session(APIView):
    def get(self, request, format=None):
        if request.user.is_authenticated:
            response = JsonResponse({
                "username": request.user.username,
                "email": request.user.email,
                "verified": request.user.verified,
                "attempted_verification": request.user.attempted_verification,
                "consent": request.user.consent,
                "attempted_consent": request.user.attempted_consent
            })

        else:
            response = JsonResponse({"username": None})

        response.set_cookie('csrftoken', get_token(request, ))
        return response


class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Area.objects.all()
    serializer_class = DistrictViewSerializer
