from apps.webcam import views as webcam_views
from django.urls import include, path
from rest_framework import routers

webcam_router = routers.DefaultRouter()
webcam_router.register(r"", webcam_views.WebcamViewSet, basename="webcams")

urlpatterns = [
    path("", include(webcam_router.urls)),
]
