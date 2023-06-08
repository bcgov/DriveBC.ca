from django.urls import include, path

urlpatterns = [
    path('users/', include("apps.authentication.urls")),
    path('webcams/', include("apps.webcam.urls")),
]
