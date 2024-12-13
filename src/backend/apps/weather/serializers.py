from zoneinfo import ZoneInfo

from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

tz = ZoneInfo("America/Vancouver")


class RegionalWeatherSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = RegionalWeather
        fields = [
            'id',
            'location',
            'conditions',
            'name',
            'station',
            'observed',
            'forecast_group',
            'forecast_issued',
            'sunrise',
            'sunset',
            'warnings',
        ]

    def get_id(self, obj):
        return obj.code


# Current Weather serializer
class CurrentWeatherSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    air_temperature = serializers.SerializerMethodField()
    road_temperature = serializers.SerializerMethodField()
    precipitation = serializers.SerializerMethodField()
    precipitation_stdobs = serializers.SerializerMethodField()
    snow = serializers.SerializerMethodField()
    snow_stdobs = serializers.SerializerMethodField()
    average_wind = serializers.SerializerMethodField()
    wind_direction = serializers.SerializerMethodField()
    maximum_wind = serializers.SerializerMethodField()
    road_condition = serializers.SerializerMethodField()

    class Meta:
        model = CurrentWeather
        fields = [
            'id',
            'weather_station_name',
            'air_temperature',
            'average_wind',
            'wind_direction',
            'precipitation',
            'precipitation_stdobs',
            'snow',
            'snow_stdobs',
            'road_temperature',
            'maximum_wind',
            'road_condition',
            'location',
            'location_description',
            'hourly_forecast_group',
            'issuedUtc',
            'elevation'
        ]

    def get_id(self, obj):
        return obj.code

    def get_air_temperature(self, obj):
        if "air_temperature" in obj.datasets:
            data = obj.datasets["air_temperature"]
            return f'{round(float(data["value"]))}'

    def get_road_temperature(self, obj):
        if "road_temperature" in obj.datasets:
            data = obj.datasets["road_temperature"]
            return f'{round(float(data["value"]))}'

    def get_precipitation(self, obj):
        if "precipitation" in obj.datasets:
            data = obj.datasets["precipitation"]
            value = round(float(data["value"]), 1) if float(data["value"]) > 0 else 0  # Replace negative values with 0
            return f'{value} {data["unit"]}'

    def get_precipitation_stdobs(self, obj):
        if "precipitation_stdobs" in obj.datasets:
            data = obj.datasets["precipitation_stdobs"]
            value = round(float(data["value"]), 1) if float(data["value"]) > 0 else 0  # Replace negative values with 0
            return f'{value} {data["unit"]}'

    def get_snow(self, obj):
        if "snow" in obj.datasets:
            data = obj.datasets["snow"]
            value = round(float(data["value"]), 1) if float(data["value"]) > 0 else 0  # Replace negative values with 0
            return f'{value} {data["unit"]}'

    def get_snow_stdobs(self, obj):
        if "snow_stdobs" in obj.datasets:
            data = obj.datasets["snow_stdobs"]
            value = round(float(data["value"]), 1) if float(data["value"]) > 0 else 0  # Replace negative values with 0
            return f'{value} {data["unit"]}'

    def get_average_wind(self, obj):
        if "average_wind" in obj.datasets:
            data = obj.datasets["average_wind"]
            return f'{round(float(data["value"]))} {data["unit"]}'

    def get_wind_direction(self, obj):
        if "wind_direction" in obj.datasets:
            data = obj.datasets["wind_direction"]
            degree = float(data["value"])
            directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
            index = round(degree / 45) % 8
            return directions[index]

    def get_maximum_wind(self, obj):
        if "maximum_wind" in obj.datasets:
            data = obj.datasets["maximum_wind"]
            return f'{round(float(data["value"]))} {data["unit"]}'

    def get_road_condition(self, obj):
        if "road_surface" in obj.datasets:
            data = obj.datasets["road_surface"]
            return data["value"]


class HighElevationForecastSerializer(serializers.ModelSerializer):
    """ The outbound serializer, consumed by the frontend """

    id = serializers.SerializerMethodField()
    location = GeometryField()
    hwyName = serializers.SerializerMethodField()
    hwyDescription = serializers.SerializerMethodField()

    class Meta:
        model = HighElevationForecast
        exclude = (
            'created_at',
            'modified_at',
            'source',
        )

    def get_id(self, obj):
        return obj.code

    def get_hwyName(self, obj):
        parts = obj.name.rsplit('-', 1)
        return parts[0].strip() if parts else ""

    def get_hwyDescription(self, obj):
        parts = obj.name.rsplit('-', 1)
        return parts[1].strip() if len(parts) > 1 else ""
