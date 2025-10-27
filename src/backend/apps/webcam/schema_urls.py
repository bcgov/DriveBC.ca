from django.urls import path, include

# This is only for schema generation
urlpatterns = [
    path("api/webcams/", include("apps.webcam.urls")),
]