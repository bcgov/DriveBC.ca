from apps.event import views as delay_views
from django.urls import include, path
from rest_framework import routers

event_router = routers.DefaultRouter()
event_router.register(r"", delay_views.DelayViewSet, basename="events")

urlpatterns = [
    path("", include(event_router.urls)),
]
