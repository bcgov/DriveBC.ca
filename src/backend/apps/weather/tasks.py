import logging

from apps.feed.client import FeedClient
from apps.feed.serializers import HighElevationForecastSerializer
from apps.shared.enums import CacheKey
from apps.weather.client import get_regional_weather_list
from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist

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
    feed_data = get_regional_weather_list()

    codes = []
    for regional_weather_data in feed_data:
        codes.append(regional_weather_data.get('code'))
        populate_regional_weather_from_data(regional_weather_data)

    # Remove regional weather data not in the feed, but ensure there's data in
    # the feed so that an erroneous empty response doesn't empty our list
    if len(codes) > 0:
        RegionalWeather.objects.exclude(code__in=codes).delete()

    # Rebuild cache
    cache.delete(CacheKey.REGIONAL_WEATHER_LIST)


def populate_high_elevation_forecast_from_data(data):
    code = data.get('code')

    try:
        event = HighElevationForecast.objects.get(code=code)

    except ObjectDoesNotExist:
        event = HighElevationForecast(code=code)

    serializer = HighElevationForecastSerializer(event, data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()


def populate_all_high_elevation_forecast_data():
    client = FeedClient()
    feed_data = client.get_high_elevation_forecast_list()
    codes = []

    for forecast in feed_data:
        codes.append(forecast.get('code'))
        populate_high_elevation_forecast_from_data(forecast)

    # Remove forecasts not in the feed, but ensure there's data in the feed so
    # that an erroneous empty response doesn't empty our list
    if len(codes) > 0:
        HighElevationForecast.objects.exclude(code__in=codes).delete()

    # Rebuild cache
    cache.delete(CacheKey.HIGH_ELEVATION_FORECAST_LIST)


def populate_local_weather_from_data(new_current_weather_data):
    weather_station_name = new_current_weather_data.get('weather_station_name')

    # Update existing record
    weather_station_qs = CurrentWeather.objects.filter(weather_station_name=weather_station_name)
    if weather_station_qs.first():
        weather_station_qs.update(**new_current_weather_data)

    # Create new record
    else:
        CurrentWeather.objects.create(**new_current_weather_data)


def populate_all_local_weather_data(token=None):
    client = FeedClient()
    feed_data = client.get_current_weather_list(token)
    codes = []

    for current_weather_data in feed_data:
        codes.append(current_weather_data.get('code'))
        populate_local_weather_from_data(current_weather_data)

    # Remove local weather data not in the feed, but ensure there's data in the
    # feed so that an erroneous empty response doesn't empty our list
    if len(codes) > 0:
        CurrentWeather.objects.exclude(code__in=codes).delete()
