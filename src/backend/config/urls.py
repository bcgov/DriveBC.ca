from apps.shared.urls import websocket_urlpatterns as shared_ws_urls
from channels.routing import URLRouter
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # django
    path("drivebc-admin/", admin.site.urls),
    # apps
    path("api/", include("apps.shared.urls")),
    # packages
]

websocket_urlpatterns = URLRouter(
    [
        path("ws/", shared_ws_urls),
    ]
)
