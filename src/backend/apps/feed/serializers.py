from datetime import datetime

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
from rest_framework import serializers


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
class CarsClosureEventSerializer(serializers.Serializer):
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

    def to_internal_value(self, data):
        data["id"] = data["event-id"]

        data["closed"] = False
        for detail in data.get("details", []):
            if data["closed"]:
                break

            for description in detail.get("descriptions", []):
                if data["closed"]:
                    break

                kind = description.get("kind", {})
                data["closed"] = (kind.get("category") == "traffic_pattern" and
                                  kind.get("code").startswith("closed"))

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
    # event_sub_type = serializers.CharField(max_length=32, required=False)

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
    # closed = serializers.SerializerMethodField()

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
                internal_data['start'] = datetime.strptime(start, "%Y-%m-%dT%H:%M")
            if end != '':
                internal_data['end'] = datetime.strptime(end, "%Y-%m-%dT%H:%M")

        return internal_data


class EventAPISerializer(serializers.Serializer):
    events = EventFeedSerializer(many=True)


# Ferry
class FerryFeedSerializer(serializers.Serializer):
    geometry = FerryGeographyField('location', source="*")
    properties = FerryPropertiesField(source="*")


class FerryAPISerializer(serializers.Serializer):
    features = FerryFeedSerializer(many=True)
