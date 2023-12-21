from datetime import datetime
import pytz

from rest_framework import serializers

from apps.event.enums import EVENT_STATUS
from apps.feed.constants import DIRECTIONS
from apps.feed.fields import (
    DriveBCDateField,
    DriveBCField,
    DriveBCSingleListField,
    EventGeographyField,
    EventRoadsField,
    FerryGeographyField,
    FerryPropertiesField,
    WebcamHighwayField,
    WebcamImageStatsField,
    WebcamLocationField,
    WebcamRegionField,
    WebcamRegionGroupField,
)


# Webcam
class WebcamFeedSerializer(serializers.Serializer):
    id = serializers.IntegerField()

    # Description
    camName = DriveBCField('name', source="*")
    caption = serializers.CharField(max_length=256, allow_blank=True, allow_null=True)

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

    # Update status
    imageStats = WebcamImageStatsField(source="*")


class WebcamAPISerializer(serializers.Serializer):
    webcams = WebcamFeedSerializer(many=True)


# Event
class EventFeedSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=32)

    # Description
    description = serializers.CharField(max_length=1024)
    event_type = serializers.CharField(max_length=32)
    event_subtypes = DriveBCSingleListField('event_sub_type',
                                            source="*", required=False)
    # event_sub_type = serializers.CharField(max_length=32, required=False)

    # General status
    status = serializers.CharField(max_length=32)
    severity = serializers.CharField(max_length=32)

    # Location
    roads = EventRoadsField(source="*")
    geography = EventGeographyField('location', source="*")

    # Update status
    created = DriveBCDateField('first_created', source="*")
    updated = DriveBCDateField('last_updated', source="*")
    # closed = serializers.SerializerMethodField()

    # Schedule
    schedule = serializers.JSONField()

    def to_internal_value(self, data):
        # mapping CARS API fields to Open511 fields
        # data['id'] = data["event-id"]
        # details = data.get('open511-event-details', {})
        # data['event_type'] = details['event_type_description']
        # data['event_sub_type'] = details['event_subtype']
        # data['severity'] = data['representation']['priority']['name'].upper()
        # data['updated'] = datetime.fromtimestamp(data['update-time']['time']/1000,
        #                                          pytz.timezone(data['update-time']['timeZoneId'])).isoformat()
        # data['created'] = data['updated']  # hack because CARS API doesn't include event creation time
        # data['status'] = EVENT_STATUS.ACTIVE
        # data['roads'] = {
        #     'to': details['event_road_to'],
        #     'from': details['event_road_from'],
        #     'name': 'Other roads',
        #     'direction': DIRECTIONS.get(details['event_road_direction'], 'NONE')
        # }
        # data['geography'] = data['geometry']

        internal_data = super().to_internal_value(data)
        schedule = internal_data.get('schedule', {})
        if 'intervals' in schedule:
            interval = schedule['intervals'][0]
            start, end = interval.split('/')

            # Parse start and end into datetime objects
            if start != '':
                internal_data['start'] = datetime.strptime(start, "%Y-%m-%dT%H:%M")
            if end != '':
                internal_data['end'] = datetime.strptime(end, "%Y-%m-%dT%H:%M")

        return internal_data

    def get_closed(self, obj):
        for detail in self.initial_data.get('details', []):
            for desc in detail.get('descriptions', []):
                kind = desc.get('kind', {})
                if (kind.get('category') == 'traffic_pattern' and
                    kind.get('code') == 'closed'):
                    return True

        return False


class EventAPISerializer(serializers.Serializer):
    events = EventFeedSerializer(many=True)


# Ferry
class FerryFeedSerializer(serializers.Serializer):
    geometry = FerryGeographyField('location', source="*")
    properties = FerryPropertiesField(source="*")


class FerryAPISerializer(serializers.Serializer):
    features = FerryFeedSerializer(many=True)
