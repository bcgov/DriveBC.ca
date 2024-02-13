from apps.weather.models import RegionalWeather
from rest_framework import serializers


class RegionalWeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionalWeather
        exclude = ['location_latitude', 'location_longitude']
