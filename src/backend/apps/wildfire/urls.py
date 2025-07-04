from apps.wildfire import views as wildfire_views
from django.urls import include, path
from rest_framework import routers

wildfire_router = routers.DefaultRouter()
wildfire_router.register(r"", wildfire_views.WildfireViewSet, basename="wildfire")

urlpatterns = [
    path("", include(wildfire_router.urls)),
]
