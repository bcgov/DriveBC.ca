from apps.api.route_planner.views import (
    EventDataAPIView,
    RouteViewSet,
    TravelAdvisoryMessageViewSet,
    WebcamDataAPIView,
)
from django.urls import include, path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(
    "travel-advisory-messages",
    TravelAdvisoryMessageViewSet,
    basename="travel-advisory-message",
)
router.register(
    "routes",
    RouteViewSet,
    basename="route",
)

urlpatterns = [
    path(
        "webcams/",
        WebcamDataAPIView.as_view(),
        name="webcams",
    ),
    path(
        "events/",
        EventDataAPIView.as_view(),
        name="events",
    ),
    path("", include(router.urls)),
]
