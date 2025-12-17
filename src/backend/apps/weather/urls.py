from apps.weather import views as weather_views
from django.urls import include, path
from rest_framework import routers

weather_router = routers.DefaultRouter()

weather_router.register(r"regional", weather_views.RegionalWeatherViewSet, basename="regional")
weather_router.register(r"current", weather_views.CurrentWeatherViewSet, basename="current")
weather_router.register(r"hef", weather_views.HighElevationViewSet, basename="hef")

urlpatterns = [
    path('', include(weather_router.urls)),
]