from zoneinfo import ZoneInfo

from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

tz = ZoneInfo("America/Vancouver")


class RegionalWeatherSerializer(serializers.ModelSerializer):

    class Meta:
        model = RegionalWeather
        fields = [
            'id',
            'code',
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



# Current Weather serializer
class CurrentWeatherSerializer(serializers.ModelSerializer):
    air_temperature = serializers.SerializerMethodField()
    road_temperature = serializers.SerializerMethodField()
    precipitation = serializers.SerializerMethodField()
    precipitation_stdobs = serializers.SerializerMethodField()
    snow = serializers.SerializerMethodField()
    snow_stdobs = serializers.SerializerMethodField()
    snow_depth = serializers.SerializerMethodField()
    average_wind = serializers.SerializerMethodField()
    wind_direction = serializers.SerializerMethodField()
    maximum_wind = serializers.SerializerMethodField()
    road_condition = serializers.SerializerMethodField()
    visibility = serializers.SerializerMethodField()
    present_weather = serializers.SerializerMethodField()
    pavement_status = serializers.SerializerMethodField()
    pavement_grip = serializers.SerializerMethodField()

    class Meta:
        model = CurrentWeather
        fields = [
            'id',
            'code',
            'weather_station_name',
            'air_temperature',
            'average_wind',
            'wind_direction',
            'precipitation',
            'precipitation_stdobs',
            'snow',
            'snow_stdobs',
            'snow_depth',
            'road_temperature',
            'maximum_wind',
            'road_condition',
            'visibility',
            'present_weather',
            'location',
            'location_description',
            'forecast_group',
            'issuedUtc',
            'elevation',
            'pavement_status',
            'pavement_grip',
        ]

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

    def get_snow_depth(self, obj):
        if "snow_depth" in obj.datasets:
            data = obj.datasets["snow_depth"]
            value = round(float(data["value"]), 1) if float(data["value"]) > 0 else 0  # Replace negative values with 0
            return f'{round(float(data["value"]))} {data["unit"]}'

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

    def get_visibility(self, obj):
        if "visibility" in obj.datasets:
            data = obj.datasets["visibility"]
            value = round(float(data["value"]))
            if value <= 250:
                return "Dense fog"
            elif 250 < value <= 450:
                return "Limited"
            return None

    def get_present_weather(self, obj):
        if "present_weather" in obj.datasets:
            data = obj.datasets["present_weather"]
            code = int(data["value"])

            weather_map = {
                0: "Clear",
                4: "Haze or Smoke",
                5: "Haze or Smoke",
                10: "Mist",
                20: "Fog",
                21: "Precipitation",
                22: "Drizzle",
                23: "Rain",
                24: "Snow",
                30: "Fog",
                31: "Fog",
                32: "Fog",
                33: "Fog",
                34: "Fog",
                40: "Precipitation",
                41: "Precipitation",
                42: "Heavy Precipitation",
                50: "Drizzle",
                51: "Light Drizzle",
                52: "Moderate Drizzle",
                53: "Heavy Drizzle",
                60: "Rain",
                61: "Light Rain",
                62: "Moderate Rain",
                63: "Heavy Rain",
                67: "Light Mixed Rain and Snow",
                68: "Moderate or Heavy Mixed Rain and Snow",
                70: "Snow",
                71: "Light Snow",
                72: "Moderate Snow",
                73: "Heavy Snow",
                80: "Showers",
                81: "Light Rain Showers",
                82: "Moderate Rain Showers",
                83: "Heavy Rain Showers",
                84: "Very Heavy Rain Showers",
                85: "Light Snow Showers",
                86: "Moderate Snow Showers",
                87: "Heavy Snow Showers",
                89: "Hail",
            }

            label = weather_map.get(code)
            return {
                "code": code,
                "label": label,
            }

    def get_pavement_status(self, obj):
        if "pavement_status" in obj.datasets:
            data = obj.datasets["pavement_status"]
            value = round(float(data["value"]))
            if value in (1, 101, 201):
                return "Dry"
            elif value in (2, 102, 202):
                return "Moist"
            elif value in (3, 103, 203):
                return "Wet"
            elif value in (9, 109, 209):
                return "Slushy"
            elif value in (5, 105, 205):
                return "Frosty"
            elif value in (6, 106, 206):
                return "Snowy"
            elif value in (7, 107, 207):
                return "Icy"
            return None

    def get_pavement_grip(self, obj):
        if "pavement_grip" in obj.datasets:
            data = obj.datasets["pavement_grip"]
            value = float(data["value"])
            if value <= 0.16:
                return "Icy"
            elif 0.16 < value < 0.6:
                return "Slippery sections"
            return None

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
