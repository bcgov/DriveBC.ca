from apps.webcam import consumers
from apps.webcam import views as webcam_views
from channels.routing import URLRouter
from django.urls import include, path
from rest_framework import routers

webcam_router = routers.DefaultRouter()
webcam_router.register(r"", webcam_views.WebcamViewSet, basename="webcams")

urlpatterns = [
    path("", include(webcam_router.urls)),
]

websocket_urlpatterns = URLRouter(
    [
        path("", consumers.WebcamConsumer.as_asgi()),
    ]
)
