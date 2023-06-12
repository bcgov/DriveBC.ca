from django.urls import include, path
from rest_framework import routers

from apps.webcam import views as webcam_views


webcam_router = routers.DefaultRouter()
webcam_router.register(r'', webcam_views.WebcamViewSet, basename='webcams')

urlpatterns = [
    path('v1/', include((webcam_router.urls, 'v1'), namespace='v1')),
]
