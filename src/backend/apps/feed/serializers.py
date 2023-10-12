from apps.feed.fields import (
    DriveBCDateField,
    DriveBCField,
    DriveBCSingleListField,
    EventGeographyField,
    EventRoadsField,
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
class EventFeedSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=32)

    # Description
    description = serializers.CharField(max_length=1024)
    event_type = serializers.CharField(max_length=32)
    event_subtypes = DriveBCSingleListField('event_sub_type',
                                            source="*", required=False)

    # General status
    status = serializers.CharField(max_length=32)
    severity = serializers.CharField(max_length=32)

    # Location
    roads = EventRoadsField(source="*")
    geography = EventGeographyField('location', source="*")

    # Update status
    created = DriveBCDateField('first_created', source="*")
    updated = DriveBCDateField('last_updated', source="*")

    # Schedule
    schedule = serializers.JSONField()


class EventAPISerializer(serializers.Serializer):
    events = EventFeedSerializer(many=True)
