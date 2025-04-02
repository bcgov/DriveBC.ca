import html  # Importing html module for unescaping HTML entities
import zoneinfo
from datetime import datetime
from zoneinfo import ZoneInfo

from apps.feed.fields import (
    DriveBCDateField,
    DriveBCField,
    DriveBCSingleListField,
    EventGeographyField,
    EventRoadsField,
    FerryGeographyField,
    FerryPropertiesField,
    RegionalWeatherPropertiesField,
    WebcamHighwayField,
    WebcamImageStatsField,
    WebcamLocationField,
    WebcamRegionField,
    WebcamRegionGroupField,
)
from apps.rest.models import RestStop
from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField
from django.conf import settings


# Webcam
class WebcamFeedSerializer(serializers.Serializer):
    id = serializers.IntegerField()

    # Description
    camName = DriveBCField('name', source="*")
    caption = serializers.CharField(max_length=256, allow_blank=True, allow_null=True)
    dbcMark = DriveBCField('dbc_mark', source="*")
    credit = DriveBCField('credit', source="*")

    # Location
    region = WebcamRegionField(source="*")
    regionGroup = WebcamRegionGroupField(source="*")
    highway = WebcamHighwayField(source="*")
    location = WebcamLocationField(source="*")
    orientation = serializers.CharField(
        max_length=32, allow_blank=True, allow_null=True
    )  # Can be 'NULL'

    # General status
    isOn = DriveBCField('is_on', source="*")
    shouldAppear = DriveBCField('should_appear', source="*")
    isNew = DriveBCField('is_new', source="*")
    isOnDemand = DriveBCField('is_on_demand', source="*")
    message = DriveBCField('message', source='*')

    # Update status
    imageStats = WebcamImageStatsField(source="*")


class WebcamAPISerializer(serializers.Serializer):
    webcams = WebcamFeedSerializer(many=True)


# Event
class CarsClosureSerializer(serializers.Serializer):
    """
    Serializer to take CARS API events and retrieve ID and closed flag.

    As of January 2024, the CARS API events have the following structure
    that we need:

        {
            'event-id': <id>,
            ...,
            'details': [
                {
                    'category': <category>,
                    'code': <subcategory>,
                },
                ...
            ],
            ...
        }

    An event is consider to be marking a road closed if the category is
    'traffic_pattern' and the code is one that starts with 'closed'
    (e.g., 'closed', 'closed ahead', 'closed for repairs').  Other subcategories
    include the word 'closed' not at the beginning ('right lane closed') and
    do no indicate a complete closure.

    TODO: Get list of closed subcategories for explicit enumeration.
    """

    id = serializers.CharField()
    closed = serializers.BooleanField(default=False)
    highway_segment_names = serializers.CharField(allow_blank=True)
    location_description = serializers.CharField(allow_blank=True)
    location_extent = serializers.CharField(allow_blank=True)
    closest_landmark = serializers.CharField(allow_blank=True)
    next_update = serializers.DateTimeField(allow_null=True)
    start_point_linear_reference = serializers.FloatField(allow_null=True)
    route_at = serializers.CharField(allow_blank=True)
    timezone = serializers.CharField(allow_blank=True)

    def to_internal_value(self, data):
        data["id"] = data["event-id"]

        # Initial state for data we want to capture
        data["closed"] = False
        data["highway_segment_names"] = ''
        data["location_description"] = ''
        data["location_extent"] = ''
        data["closest_landmark"] = ''
        data["next_update"] = None
        data["start_point_linear_reference"] = None
        data["route_at"] = ''

        # Data under "details"
        closed_phrase_ids = settings.CLOSED_PHRASE_IDS
        int_closed_ids = list(map(int, closed_phrase_ids.split(",")))
        for detail in data.get("details", []):
            # Get closed state
            if not data["closed"]:  # Skip block if already recorded
                for description in detail.get("descriptions", []):
                    kind = description.get("kind", {})
                    if isinstance(kind, str):
                        data["closed"] = False
                    else:
                        data["closed"] = (kind.get("category") == "traffic_pattern" and kind.get("phrase-id") in int_closed_ids) or (kind.get("category") == "incident" and kind.get("phrase-id") in int_closed_ids)

                    # Stop inner for loop if already marked
                    if data["closed"]:
                        break

            # Get highway nicknames
            for location in detail.get("locations", []):
                if not data["highway_segment_names"]:  # Skip block if already recorded
                    names = location.get("segment-names", [])
                    if len(names):
                        data["highway_segment_names"] = names[0]
                        break  # No other location data, stop for loop
                route_at = location.get("route-designator")
                data["route_at"] = route_at
                break

        # Data under "communication-plans"
        for plan in data.get("communication-plans", []):
            # Get location descriptions
            if plan.get('plan-type', '') == 'BRIEF_LOCATION':
                data["location_description"] = html.unescape(plan.get('description', ''))
                break  # No other communication-plans data, stop for loop

        # Data under "communication-plan-template"
        template = data.get("communication-plan-template", {})
        # Get location length
        data["location_extent"] = template.get('extent-event-length', '')
        # Get closest landmark
        data["closest_landmark"] = html.unescape(template.get('nearby-city-reference', ''))

        # Data under "open511-event-details"
        open511_details = data.get("open511-event-details", {})
        # Get linear ref for ordering
        data["start_point_linear_reference"] = float(open511_details.get('start_point_linear_reference')) \
            if 'start_point_linear_reference' in open511_details else None

        # Data under "next-update-time"
        # Get next update time
        if "next-update-time" in data:
            next_update = data.get("next-update-time")
            data["next_update"] = datetime.fromtimestamp(
                next_update['time'] // 1000,
                tz=zoneinfo.ZoneInfo(key=next_update['timeZoneId'])
            )

        data["timezone"] = ''
        if "update-time" in data:
            data["timezone"] = data.get("update-time")['timeZoneId']

        return super().to_internal_value(data)


class EventFeedSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=32)

    # Description
    description = serializers.CharField(max_length=1024)
    event_type = serializers.CharField(max_length=32)
    event_subtypes = DriveBCSingleListField(
        'event_sub_type',
        source="*",
        required=False
    )

    # General status
    status = serializers.CharField(max_length=32)
    severity = serializers.CharField(max_length=32)
    closed = serializers.BooleanField(default=False)

    # Location
    roads = EventRoadsField(source="*")
    geography = EventGeographyField('location', source="*")

    # Update status
    created = DriveBCDateField('first_created', source="*")
    updated = DriveBCDateField('last_updated', source="*")

    # Schedule
    schedule = serializers.JSONField()

    def to_internal_value(self, data):
        internal_data = super().to_internal_value(data)
        schedule = internal_data.get('schedule', {})
        if 'intervals' in schedule:
            interval = schedule['intervals'][0]
            start, end = interval.split('/')

            # Parse start and end into datetime objects
            if start != '':
                start_time = datetime.strptime(start, "%Y-%m-%dT%H:%M").replace(tzinfo=ZoneInfo('UTC'))
                internal_data['start'] = start_time

            if end != '':
                end_time = datetime.strptime(end, "%Y-%m-%dT%H:%M").replace(tzinfo=ZoneInfo('UTC'))
                internal_data['end'] = end_time

        return internal_data


class EventAPISerializer(serializers.Serializer):
    events = EventFeedSerializer(many=True)


# Ferry
class FerryFeedSerializer(serializers.Serializer):
    geometry = FerryGeographyField('location', source="*")
    properties = FerryPropertiesField(source="*")


class FerryAPISerializer(serializers.Serializer):
    features = FerryFeedSerializer(many=True)


# Regional Weather
class RegionalWeatherFeedSerializer(serializers.Serializer):
    properties = RegionalWeatherPropertiesField(source="*")


class RegionalWeatherAPISerializer(serializers.Serializer):
    features = RegionalWeatherFeedSerializer(many=True)


class RegionalWeatherSerializer(serializers.Serializer):
    class Meta:
        model = RegionalWeather
        fields = (
            'id',
            'code',
            'station',
            'location_latitude',
            'location_longitude',
            'name',
            'region',
            'conditions',
            'hourly_forecast_group',
            'observed',
            'forecast_issued',
            'sunrise',
            'sunset',
            'warnings',
        )


# Current Weather serializer
class CurrentWeatherSerializer(serializers.Serializer):
    class Meta:
        model = CurrentWeather
        fields = (
            'id',
            'location_latitude',
            'location_longitude',
            'weather_station_name',
            'elevation',
            'location_description',
            'datasets',
            'issuedUtc',
        )


class HighElevationForecastSerializer(serializers.ModelSerializer):
    """ The inbound serializer, converting our feed to our model """

    location = GeometryField()

    class Meta:
        model = HighElevationForecast
        fields = '__all__'


# Rest Stop serializer
class RestStopSerializer(serializers.Serializer):
    class Meta:
        model = RestStop
        fields = (
            'id',
            'geometry',
            'properties',
            'bbox',
        )
