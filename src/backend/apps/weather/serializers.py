from apps.weather.models import RegionalCurrent, RegionalForecast, RegionalWeather
from rest_framework import serializers

class RegionalCurrentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionalCurrent
        fields = '__all__'

class RegionalForecastSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionalForecast
        fields = '__all__'

class RegionalWeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionalWeather
        fields = '__all__'