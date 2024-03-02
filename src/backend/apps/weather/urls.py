from apps.weather import views as weather_views
from django.urls import include, path
from rest_framework import routers

weather_router = routers.DefaultRouter()
weather_router.register(r"", weather_views.WeatherViewSet, basename="weather")

urlpatterns = [
    path('regional', weather_views.WeatherViewSet.as_view({'get': 'regional'}), name='regional'),
    path('current', weather_views.WeatherViewSet.as_view({'get': 'current'}), name='current'),
    path('', include(weather_router.urls)),
]
