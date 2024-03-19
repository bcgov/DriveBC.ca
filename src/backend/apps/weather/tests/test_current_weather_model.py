from unittest.mock import patch

from apps.shared.tests import BaseTest
from apps.weather.models import BaseModel, CurrentWeather
from apps.weather.serializers import CurrentWeatherSerializer


def mocked_method(self):
    # Method to block the base model save function
    return True

class TestCurrentWeatherModel(BaseTest):

    @patch.object(BaseModel, 'save', mocked_method)
    def test_model_save(self):
        current_weather_test = CurrentWeather(
            weather_station_name="Vancouver",
            location_latitude=58.66,
            location_longitude=-124.64,
        )
        current_weather_test.save();

        assert(current_weather_test.location == "SRID=4326;POINT (58.66 -124.64)")
