import datetime
import logging

from apps.feed.client import FeedClient
from apps.shared.enums import CacheKey
from apps.weather.models import CurrentWeather, RegionalWeather
from django.core.cache import cache

logger = logging.getLogger(__name__)


def populate_regional_weather_from_data(new_data):
    code = new_data.get('code')
    existing_record = RegionalWeather.objects.filter(code=code).first()
    data = {
        'code': code,
        'location_latitude': new_data.get('location_latitude'),
        'location_longitude': new_data.get('location_longitude'),
        'name': new_data.get('name'),
        'region': new_data.get('region'),
        'conditions': new_data.get('conditions'),
        'forecast_group': new_data.get('forecast_group'),
        'hourly_forecast_group': new_data.get('hourly_forecast_group'),
        'station': new_data.get('station'),
        'observed': new_data.get('observed'),
        'forecast_issued': new_data.get('forecast_issued'),
        'sunrise': new_data.get('sunrise'),
        'sunset': new_data.get('sunset'),
        'warnings': new_data.get('warnings'),
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


def populate_current_weather_from_data(new_current_weather_data):
    weather_station_name = new_current_weather_data.get('weather_station_name')
    existing_record = CurrentWeather.objects.filter(weather_station_name=weather_station_name).first()
    issued_utc = new_current_weather_data.get('issuedUtc')
    if issued_utc is not None:
        issued_utc = datetime.datetime.strptime(issued_utc, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)

    data = {
        'weather_station_name': weather_station_name,
        'elevation': new_current_weather_data.get('elevation'),
        'location_description': new_current_weather_data.get('location_description'),
        'datasets': new_current_weather_data.get('datasets'),
        'location_latitude': new_current_weather_data.get('location_latitude'),
        'location_longitude': new_current_weather_data.get('location_longitude'),
        'issuedUtc': issued_utc
     }
    if existing_record:
        existing_record.__dict__.update(data)
        existing_record.save()
    else:
        CurrentWeather.objects.create(**data)


def populate_all_current_weather_data():
    client = FeedClient()
    feed_data = client.get_current_weather_list()

    for current_weather_data in feed_data:
        populate_current_weather_from_data(current_weather_data)
