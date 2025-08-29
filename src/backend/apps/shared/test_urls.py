from apps.event import views as event_views
from apps.shared import views as shared_views
from apps.webcam import views as camera_views
from django.urls import include, path
from rest_framework import routers

test_router = routers.DefaultRouter()
test_router.register(r"cameras", camera_views.CameraViewSet,
                     basename="test_cameras")
test_router.register(r"events", event_views.EventTestViewSet,
                     basename="test_events")

urlpatterns = [
    path("", include(test_router.urls)),
    path("app/", shared_views.AppTestViewSet.as_view(), name="test_app"),
    path("appcache/", shared_views.AppCacheTestViewSet.as_view(), name="test_appcache"),
    path("appdb/", shared_views.AppDbTestViewSet.as_view(), name="test_db"),
]
