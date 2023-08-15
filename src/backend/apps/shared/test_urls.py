from apps.event import views as delay_views
from apps.shared import views as shared_views
from apps.webcam import views as webcam_views
from django.urls import include, path
from rest_framework import routers

test_router = routers.DefaultRouter()
test_router.register(r"webcams", webcam_views.WebcamTestViewSet,
                     basename="test_webcams")
test_router.register(r"delays", delay_views.DelayTestViewSet,
                     basename="test_delays")

urlpatterns = [
    path("", include(test_router.urls)),
    path("appcache/", shared_views.AppCacheTestViewSet.as_view(), name="test_appcache"),
]
