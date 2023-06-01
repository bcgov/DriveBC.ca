import logging

from apps.api.route_planner.permissions import IsAdminOrReadOnly
from apps.api.route_planner.serializers import (
    RouteParameterSerializer,
    RouteSerializer,
    TravelAdvisoryMessageSerializer,
)
from rest_framework.permissions import AllowAny
from apps.drivebc_api.drivebc_client import DrivebcClient
from apps.route_planner.models import Route, TravelAdvisoryMessage
from django.contrib.gis.geos import LineString, Point
from django.http import JsonResponse
import json
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from httpx import HTTPStatusError, RequestError
from rest_framework import mixins, status, views, viewsets
from rest_framework.exceptions import APIException
from rest_framework.response import Response

logger = logging.getLogger(__name__)


class TravelAdvisoryMessageViewSet(viewsets.ModelViewSet):
    """Create, read, update or delete travel advisory messages"""

    queryset = TravelAdvisoryMessage.objects.all()
    serializer_class = TravelAdvisoryMessageSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_staff:
            now = timezone.now()
            return qs.filter(pub_date__isnull=False, pub_date__lt=now)
        return qs


class WebcamDataAPIView(views.APIView):
    """Retrieve webcam data from Drive BC API"""
    permission_classes = (AllowAny, )
    @method_decorator(cache_page(60 * 60 * 2))
    def get(self, request, *args, **kwargs):
        webcam_data = DrivebcClient().get_webcams()
        return JsonResponse(data=webcam_data)


class RouteViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = (AllowAny, )
    queryset = Route.objects.all()
    serializer_class = RouteSerializer

    @staticmethod
    def _get_params_data(request):
        params_serializer = RouteParameterSerializer(data=request.data)
        params_serializer.is_valid(raise_exception=True)
        return params_serializer.validated_data

    @staticmethod
    def _extract_coordinates(params_data):
        start = params_data.get("start_location", {})
        destination = params_data.get("destination", {})
        return (
            start.get("lng"),
            start.get("lat"),
            destination.get("lng"),
            destination.get("lat"),
        )

    def create(self, request, *args, **kwargs):
        route_data = {}
        params_data = self._get_params_data(request)
        x_lng, x_lat, y_lng, y_lat = self._extract_coordinates(params_data)
        points_str = f"{x_lng},{x_lat},{y_lng},{y_lat}"
        try:
            route_data = DrivebcClient().get_route_data(points=points_str)
        except (HTTPStatusError, RequestError) as e:
            logger.error(f"An error occurred when requesting a route: {e}")
            raise
        if not (route_data and route_data.get("is_route_found")):
            raise APIException("This route cannot be calculated")
        # Update route data returned from API with data from request
        route_data["email"] = params_data.get("email")
        route_data["name"] = params_data.get("name")
        route_data["start_point"] = Point(x_lng, x_lat)
        route_data["destination_point"] = Point(y_lng, y_lat)
        route_data["route_points"] = LineString(route_data.get("route_points"))
        serializer = self.get_serializer(data=route_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class EventDataAPIView(views.APIView):
    """Retrieve road event data from Drive BC API"""
    permission_classes = (AllowAny, )

    @method_decorator(cache_page(60 * 5))
    def get(self, request, *args, **kwargs):
        event_data = DrivebcClient().get_events()
        return JsonResponse(data=event_data)
