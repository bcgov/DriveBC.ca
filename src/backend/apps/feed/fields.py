import datetime

import pytz
from apps.shared.helpers import parse_and_localize_time_str
from django.contrib.gis.geos import Point
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField


# Shared
class DriveBCField(serializers.Field):
    def __init__(self, custom_field_name, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.custom_field_name = custom_field_name

    def to_internal_value(self, data):
        res = {
            self.custom_field_name: data,
        }
        return res


class DriveBCSingleListField(DriveBCField):
    def to_internal_value(self, data):
        res = {
            self.custom_field_name: data[0],
        }
        return res


class DriveBCDateField(serializers.DateTimeField):
    def __init__(self, custom_field_name, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.custom_field_name = custom_field_name

    def to_internal_value(self, value):
        datetime_value = super().to_internal_value(value)

        # Use current time instead of future time
        if datetime_value and datetime_value > datetime.datetime.now(pytz.utc):
            datetime_value = datetime.datetime.now(pytz.timezone('America/Vancouver'))

        res = {
            self.custom_field_name: datetime_value,
        }

        return res


# Webcam
class WebcamRegionField(serializers.Field):
    def to_internal_value(self, data):
        ret = {
            "region": data['group'],
            "region_name": data['name'],
        }
        return ret


class WebcamRegionGroupField(serializers.Field):
    def to_internal_value(self, data):
        ret = {
            "highway_group": data['highwayGroup'],
            "highway_cam_order": data['highwayCamOrder'],
        }
        return ret


class WebcamHighwayField(serializers.Field):
    def to_internal_value(self, data):
        ret = {
            "highway": str(data["number"]),
            "highway_description": data["locationDescription"],
        }
        return ret


class WebcamLocationField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            "location": Point(data['longitude'], data['latitude']),
            "elevation": data['elevation'],
        }
        return res


class WebcamImageStatsField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            "marked_stale": data["markedStale"],
            "marked_delayed": data["markedDelayed"],
            "last_update_attempt": parse_and_localize_time_str(
                data["lastAttempt"]['time']
            ),
            "last_update_modified": parse_and_localize_time_str(
                data["lastModified"]['time']
            ),
            "update_period_mean": data["updatePeriodMean"],
            "update_period_stddev": data["updatePeriodStdDev"],
        }
        return res


# Event
class EventRoadsField(serializers.Field):
    def to_internal_value(self, data):
        route_dict = data[0]
        res = {
            "route_at": route_dict["name"],
            "route_from": route_dict["from"],
            "route_to": route_dict["to"] if "to" in route_dict else "",
            "direction": route_dict["direction"]
        }
        return res


class EventGeographyField(DriveBCField, GeometryField):
    pass


# Ferry
class FerryPropertiesField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            "id": data['FERRY_ID'],
            "title": data['NAME'],
            "url": data['URL'],
            "feed_created_at": data['CREATED_TIMESTAMP'],
            "feed_modified_at": data['UPDATED_TIMESTAMP'],
        }
        return res


class FerryGeographyField(DriveBCField, GeometryField):
    pass
