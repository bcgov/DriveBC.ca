from collections import OrderedDict
import logging
from apps.weather.models import RegionalWeather
from apps.weather.serializers import RegionalWeatherSerializer
from apps.feed.client import FeedClient
from apps.shared.enums import CacheKey
from django.contrib.gis.geos import LineString, Point
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)
def populate_regional_weather_from_data(new_regional_weather_data):
    location_code = new_regional_weather_data.get('location_code')
    existing_record = RegionalWeather.objects.filter(location_code=location_code).first()
    data = {
        'location_code': location_code,
        'location_latitude': new_regional_weather_data.get('location_latitude'),
        'location_longitude': new_regional_weather_data.get('location_longitude'),
        'location_name': new_regional_weather_data.get('location_name'),
        'region': new_regional_weather_data.get('region'),
        'observation_name': new_regional_weather_data.get('observation_name'),
        'observation_zone': new_regional_weather_data.get('observation_zone'),
        'observation_utc_offset': new_regional_weather_data.get('observation_utc_offset'),
        'observation_text_summary': new_regional_weather_data.get('observation_text_summary'),
        'conditions': new_regional_weather_data.get('conditions'),
        'forecast_group': new_regional_weather_data.get('forecast_group'),
        'hourly_forecast_group': new_regional_weather_data.get('hourly_forecast_group'),
    }

    if existing_record:
        existing_record.__dict__.update(data)
        existing_record.save()
    else:
        RegionalWeather.objects.create(**data)


def populate_all_regional_weather_data():
    client = FeedClient()
    feed_data = client.get_regional_weather_list()

    for regional_weather_data in feed_data:
        populate_regional_weather_from_data(regional_weather_data)

    # Rebuild cache
    cache.delete(CacheKey.REGIONAL_WEATHER_LIST)
