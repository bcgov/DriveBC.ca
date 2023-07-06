from django.contrib.gis.geos import Point
from rest_framework import serializers

from apps.shared.helpers import parse_and_localize_time_str


class RegionField(serializers.Field):
    def to_internal_value(self, data):
        ret = {
            "region": data['group'],
            "region_name": data['name'],
        }
        return ret


class RegionGroupField(serializers.Field):
    def to_internal_value(self, data):
        ret = {
            "highway_group": data['highwayGroup'],
            "highway_cam_order": data['highwayCamOrder'],
        }
        return ret


class HighwayField(serializers.Field):
    def to_internal_value(self, data):
        ret = {
            "highway": str(data["number"]),
            "highway_description": data["locationDescription"],
        }
        return ret


class LocationField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            "location": Point(data['longitude'], data['latitude']),
            "elevation": data['elevation'],
        }
        return res


class ImageStatsField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            "marked_stale": data["markedStale"],
            "marked_delayed": data["markedDelayed"],
            "is_on": data["isOn"],
            "last_update_attempt": parse_and_localize_time_str(data["lastAttempt"]['time']),
            "last_update_modified": parse_and_localize_time_str(data["lastModified"]['time']),
            "update_period_mean": data["updatePeriodMean"],
            "update_period_stddev": data["updatePeriodStdDev"],
        }
        return res


class CustomDrivebcField(serializers.Field):
    def __init__(self, custom_field_name, *args, **kwargs):
        super(CustomDrivebcField, self).__init__(*args, **kwargs)
        self.custom_field_name = custom_field_name

    def to_internal_value(self, data):
        res = {
            self.custom_field_name: data,
        }
        return res


class WebcamFeedSerializer(serializers.Serializer):
    id = serializers.IntegerField()

    # Description
    camName = CustomDrivebcField('name', source='*')
    caption = serializers.CharField(max_length=256)

    # Location
    region = RegionField(source='*')
    regionGroup = RegionGroupField(source='*')
    highway = HighwayField(source='*')
    location = LocationField(source='*')
    orientation = serializers.CharField(max_length=32, allow_blank=True, allow_null=True)  # Can be 'NULL'

    # General status
    isOn = CustomDrivebcField('is_on', source='*')
    shouldAppear = CustomDrivebcField('should_appear', source='*')
    isNew = CustomDrivebcField('is_new', source='*')
    isOnDemand = CustomDrivebcField('is_on_demand', source='*')

    # Update status
    imageStats = ImageStatsField(source='*')


class WebcamAPISerializer(serializers.Serializer):
    webcams = WebcamFeedSerializer(many=True)
