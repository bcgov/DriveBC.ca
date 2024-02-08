import datetime
import zoneinfo
from copy import copy

# from apps.event import enums as event_enums
from apps.weather.models import RegionalWeather
from apps.weather.serializers import RegionalWeatherSerializer
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import LineString


class TestRegionalWeatherSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.regional_weather = RegionalWeather(
            code = "s0000341",
            location_latitude = "58.66N", 
            location_longitude = "124.64W",
        )
        
        self.regional_weather_2 = RegionalWeather(
            code = "s0000846",
            location_latitude = "57.06N", 
            location_longitude = "123.94W",
        )

        self.regional_weather.id = "1"
        self.regional_weather.save()

        self.regional_weather_2.id = "2"
        self.regional_weather_2.code = 's0000849'
        self.regional_weather_2.save()

        self.serializer = RegionalWeatherSerializer(self.regional_weather)
        self.serializer_two = RegionalWeatherSerializer(self.regional_weather_2)

    def test_serializer_data(self):
        assert len(self.serializer.data) == 15
        assert self.serializer.data['code'] == \
               "s0000341"
        assert self.serializer.data['location_latitude'] == \
               "58.66N"
        assert self.serializer.data['location_longitude'] == \
               "124.64W"
        
        assert self.serializer_two.data['code'] == \
               "s0000849"
        assert self.serializer_two.data['location_latitude'] == \
               "57.06N"
        assert self.serializer_two.data['location_longitude'] == \
               "123.94W"
