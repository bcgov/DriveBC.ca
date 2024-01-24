from apps.weather.models import RegionalWeather
from rest_framework import serializers

class RegionalWeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionalWeather
        fields = '__all__'