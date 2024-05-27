from datetime import datetime
from zoneinfo import ZoneInfo

from apps.weather.models import CurrentWeather, RegionalWeather
from rest_framework import serializers


tz = ZoneInfo("America/Vancouver")


class RegionalWeatherSerializer(serializers.ModelSerializer):

    class Meta:
        model = RegionalWeather
        fields = ['location',
                  'conditions',
                  'name',
                  'station',
                  'observed',
                  'forecast_issued',
                  'sunrise',
                  'sunset',
                  'warnings',
                  ]


# Current Weather serializer
class CurrentWeatherSerializer(serializers.ModelSerializer):
    air_temperature = serializers.SerializerMethodField()
    road_temperature = serializers.SerializerMethodField()
    precipitation = serializers.SerializerMethodField()
    snow = serializers.SerializerMethodField()
    average_wind = serializers.SerializerMethodField()
    maximum_wind = serializers.SerializerMethodField()
    road_condition = serializers.SerializerMethodField()

    class Meta:
        model = CurrentWeather
        fields = ['id',
                  'weather_station_name',
                  'air_temperature',
                  'average_wind',
                  'precipitation',
                  'snow',
                  'road_temperature',
                  'maximum_wind',
                  'road_condition',
                  'location',
                  'location_description',
                  'issuedUtc',
                  'elevation']

    def get_air_temperature(self, obj):
        if "air_temperature" in obj.datasets:
            data = obj.datasets["air_temperature"]
            return f'{round(float(data["value"]))} {data["unit"]}'
        return None

    def get_road_temperature(self, obj):
        if "road_temperature" in obj.datasets:
            data = obj.datasets["road_temperature"]
            return f'{round(float(data["value"]))} {data["unit"]}'
        return None

    def get_precipitation(self, obj):
        if "precipitation" in obj.datasets:
            data = obj.datasets["precipitation"]
            return f'{data["value"]} {data["unit"]}'
        return None

    def get_snow(self, obj):
        if "snow" in obj.datasets:
            data = obj.datasets["snow"]
            return f'{data["value"]} {data["unit"]}'
        return

    def get_average_wind(self, obj):
        if "average_wind" in obj.datasets:
            data = obj.datasets["average_wind"]
            return f'{data["value"]} {data["unit"]}'
        return

    def get_maximum_wind(self, obj):
        if "maximum_wind" in obj.datasets:
            data = obj.datasets["maximum_wind"]
            return f'{data["value"]} {data["unit"]}'
        return None

    def get_road_condition(self, obj):
        if "road_surface" in obj.datasets:
            data = obj.datasets["road_surface"]
            return data["value"]
        return None

