from apps.weather import views as weather_views
from django.urls import include, path
from rest_framework import routers

weather_router = routers.DefaultRouter()
weather_router.register(r"", weather_views.WeatherViewSet, basename="weather")

urlpatterns = [
    path('regionalcurrent/<str:pk>', weather_views.WeatherViewSet.as_view({'get': 'regionalcurrent'}), name='regionalcurrent'),
    path('', include(weather_router.urls)),
]
