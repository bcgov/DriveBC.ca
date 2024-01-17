from apps.weather import views as weather_views
from django.urls import include, path
from rest_framework import routers

# from apps.weather.views import WeatherCityForecastView


weather_router = routers.DefaultRouter()
weather_router.register(r"", weather_views.WeatherViewSet, basename="weather")



urlpatterns = [
    # path('api/v1/ec/cityforecast/', weather_views.WeatherViewSet.as_view({'get': 'list'}), name='cityforecast'),
    # path("", include(weather_router.urls)),

    # path('api/weather/cityforecast/<int:id>/', WeatherCityForecastView.as_view(), name='weather_cityforecast'),

    path('', include(weather_router.urls)),

]
