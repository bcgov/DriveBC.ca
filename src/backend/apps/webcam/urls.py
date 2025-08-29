from apps.webcam import views as webcam_views
from django.urls import include, path
from rest_framework import routers

camera_router = routers.DefaultRouter()
camera_router.register(r"", webcam_views.CameraViewSet, basename="webcams")

urlpatterns = [
    path("", include(camera_router.urls)),
]
