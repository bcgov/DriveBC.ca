from apps.event import views as event_views
from django.urls import include, path
from rest_framework import routers

event_router = routers.DefaultRouter()
event_router.register(r"", event_views.EventViewSet, basename="events")

urlpatterns = [
    path("", include(event_router.urls)),
]
