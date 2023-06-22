from django.urls import include, path

urlpatterns = [
    path("webcams/", include("apps.webcam.urls")),
]
