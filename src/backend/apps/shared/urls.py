from apps.webcam.urls import websocket_urlpatterns as webcam_ws_urls
from channels.routing import URLRouter
from django.urls import include, path

urlpatterns = [
    path("webcams/", include("apps.webcam.urls")),
]

websocket_urlpatterns = URLRouter(
    [
        path("webcams/", webcam_ws_urls),
    ]
)
