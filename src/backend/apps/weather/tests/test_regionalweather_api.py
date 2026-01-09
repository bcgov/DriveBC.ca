from apps.shared.tests import BaseTest
from apps.weather.models import RegionalWeather
from rest_framework.test import APITestCase


class TestRegionalWeatherAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        self.weather = RegionalWeather.objects.create(
            code="s0000341",
            location_latitude="58.66S",
            location_longitude="124.64W",
            forecast_group={}
        )
        self.weather.save()

    def test_get_forecasts(self):
        forecasts = self.weather.get_forecasts()
        assert len(forecasts) == 0
        assert (self.weather.__str__() == 'Regional Forecast for ' + str(self.weather.code) +
                ' (' + str(self.weather.station) + ')')
