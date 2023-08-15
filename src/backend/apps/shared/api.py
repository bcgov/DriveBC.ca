from django.urls import include, path

urlpatterns = [
    path("webcams/", include("apps.webcam.urls")),
    path("events/", include("apps.event.urls")),
    path("test/", include("apps.shared.test_urls")),
]
