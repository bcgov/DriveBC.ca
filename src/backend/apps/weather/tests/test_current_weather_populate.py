import copy
import json
import logging
from pathlib import Path
from unittest.mock import patch

from apps.shared.tests import BaseTest, MockResponse
from apps.weather.models import CurrentWeather
from apps.weather.tasks import (
    populate_all_local_weather_data,
    populate_local_weather_from_data,
)
from apps.weather.tests.test_data.local_weather_parsed_feed import (
    parsed_feed,
    parsed_summer_feed,
)
from rest_framework.test import APIClient
from apps.weather.serializers import CurrentWeatherSerializer

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)


class TestCurrentWeatherPopulate(BaseTest):
    def setUp(self):
        self.client = APIClient()

        # Areas
        local_weather_stations_list_of_one = open(
            str(Path(__file__).parent) +
            "/test_data/local_weather_stations_list_of_one.json"
        )
        self.mock_local_weather_stations = json.load(local_weather_stations_list_of_one)

        # Weather data for 10461
        local_weather_station_data_10461 = open(
            str(Path(__file__).parent) +
            "/test_data/local_weather_station_data_10461.json"
        )
        self.mock_local_weather_station_data_10461 = json.load(local_weather_station_data_10461)

    @patch('requests.get')
    def test_populate_local_weather(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_local_weather_stations, status_code=200),
            MockResponse({}, status_code=204),  # Summer data, no forecasts
            MockResponse(self.mock_local_weather_station_data_10461, status_code=200),
        ]

        populate_all_local_weather_data('mock_token')

        assert CurrentWeather.objects.all().count() == 1

    def test_populate_current_weather_function(self):
        populate_local_weather_from_data(parsed_feed)

        local_weather_winter = CurrentWeather.objects.get(weather_station_name='Brandywine Devar')
        assert local_weather_winter.location_longitude == '-123.11806'
        assert len(local_weather_winter.forecast_group) != 0

        # Update existing record
        updated_parsed_feed = copy.copy(parsed_feed)
        updated_parsed_feed['location_longitude'] = '-123.11807'
        populate_local_weather_from_data(updated_parsed_feed)
        local_weather_winter = CurrentWeather.objects.filter(weather_station_name='Brandywine Devar')
        assert local_weather_winter.count() == 1
        assert local_weather_winter.first().location_longitude == '-123.11807'

        populate_local_weather_from_data(parsed_summer_feed)
        local_weather_summer = CurrentWeather.objects.get(weather_station_name='Brandywine Devar Summer')
        assert len(local_weather_summer.forecast_group) == 0


class TestCurrentWeatherSerializer(BaseTest):
    def _make_weather_obj(self, datasets):
        """Helper to create a CurrentWeather instance with given datasets."""
        obj = CurrentWeather(
            weather_station_name='Test Station',
            datasets=datasets,
            location_description='Test Location',
            forecast_group=[],
            elevation=100,
        )
        return obj

    def test_get_air_temperature(self):
        obj = self._make_weather_obj({'air_temperature': {'value': '5.7'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['air_temperature'] == '6'

    def test_get_road_temperature(self):
        obj = self._make_weather_obj({'road_temperature': {'value': '-1.3'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['road_temperature'] == '-1'

    def test_get_precipitation_positive(self):
        obj = self._make_weather_obj({'precipitation': {'value': '2.5', 'unit': 'mm'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['precipitation'] == '2.5 mm'

    def test_get_precipitation_negative_clamped_to_zero(self):
        obj = self._make_weather_obj({'precipitation': {'value': '-0.3', 'unit': 'mm'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['precipitation'] == '0 mm'

    def test_get_snow(self):
        obj = self._make_weather_obj({'snow': {'value': '3.0', 'unit': 'cm'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['snow'] == '3.0 cm'

    def test_get_snow_stdobs(self):
        obj = self._make_weather_obj({'snow_stdobs': {'value': '-1.0', 'unit': 'cm'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['snow_stdobs'] == '0 cm'

    def test_get_snow_depth(self):
        obj = self._make_weather_obj({'snow_depth': {'value': '1.0', 'unit': 'cm'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['snow_depth'] == '1 cm'

    def test_get_precipitation_stdobs(self):
        obj = self._make_weather_obj({'precipitation_stdobs': {'value': '1.2', 'unit': 'mm'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['precipitation_stdobs'] == '1.2 mm'

    def test_get_average_wind(self):
        obj = self._make_weather_obj({'average_wind': {'value': '45.6', 'unit': 'km/h'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['average_wind'] == '46 km/h'

    def test_get_wind_direction(self):
        cases = [
            ('0', 'N'),
            ('45', 'NE'),
            ('90', 'E'),
            ('135', 'SE'),
            ('180', 'S'),
            ('225', 'SW'),
            ('270', 'W'),
            ('315', 'NW'),
        ]
        for degree, expected in cases:
            obj = self._make_weather_obj({'wind_direction': {'value': degree}})
            data = CurrentWeatherSerializer(obj).data
            assert data['wind_direction'] == expected, f"Expected {expected} for {degree}°"

    def test_get_maximum_wind(self):
        obj = self._make_weather_obj({'maximum_wind': {'value': '80.2', 'unit': 'km/h'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['maximum_wind'] == '80 km/h'

    def test_get_road_condition(self):
        obj = self._make_weather_obj({'road_surface': {'value': 'Wet'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['road_condition'] == 'Wet'

    def test_get_visibility_dense_fog(self):
        obj = self._make_weather_obj({'visibility': {'value': '200'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['visibility'] == 'Dense fog'

    def test_get_visibility_limited(self):
        obj = self._make_weather_obj({'visibility': {'value': '300'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['visibility'] == 'Limited'

    def test_get_visibility_clear_returns_none(self):
        obj = self._make_weather_obj({'visibility': {'value': '1000'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['visibility'] is None

    def test_get_visibility_missing_returns_none(self):
        obj = self._make_weather_obj({})
        data = CurrentWeatherSerializer(obj).data
        assert data['visibility'] is None

    def test_get_present_weather_known_code(self):
        obj = self._make_weather_obj({'present_weather': {'value': '63'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['present_weather'] == {'code': 63, 'label': 'Heavy Rain'}

    def test_get_present_weather_unknown_code(self):
        obj = self._make_weather_obj({'present_weather': {'value': '99'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['present_weather'] == {'code': 99, 'label': None}

    def test_get_present_weather_clear(self):
        obj = self._make_weather_obj({'present_weather': {'value': '0'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['present_weather']['label'] == 'Clear'

    def test_get_pavement_status_known_code(self):
        obj = self._make_weather_obj({'pavement_status': {'value': '1'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['pavement_status'] == 'Dry'

    def test_get_pavement_status_unknown_code(self):
        obj = self._make_weather_obj({'pavement_status': {'value': '4'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['pavement_status'] is None

    def test_get_pavement_status_icy(self):
        obj = self._make_weather_obj({'pavement_status': {'value': '7'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['pavement_status'] == 'Icy'

    def test_get_pavement_grip_icy(self):
        obj = self._make_weather_obj({'pavement_grip': {'value': '0.16'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['pavement_grip'] == 'Icy'

    def test_get_pavement_grip_slippery_sections(self):
        obj = self._make_weather_obj({'pavement_grip': {'value': '0.3'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['pavement_grip'] == 'Slippery sections'

    def test_get_pavement_grip_other(self):
        obj = self._make_weather_obj({'pavement_grip': {'value': '0.7'}})
        data = CurrentWeatherSerializer(obj).data
        assert data['pavement_grip'] is None

    def test_missing_datasets_return_none(self):
        """All get_* methods should return None gracefully when dataset key is absent."""
        obj = self._make_weather_obj({})
        data = CurrentWeatherSerializer(obj).data
        for field in ['air_temperature', 'road_temperature', 'precipitation',
                      'precipitation_stdobs', 'snow', 'snow_stdobs', 'average_wind',
                      'wind_direction', 'maximum_wind', 'road_condition', 'present_weather']:
            assert data[field] is None, f"Expected None for missing {field}"