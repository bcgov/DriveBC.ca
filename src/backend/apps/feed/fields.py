from apps.shared.helpers import parse_and_localize_time_str
from django.contrib.gis.geos import LineString, Point
from rest_framework import serializers


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
        route_text = route_dict["name"] + " " + route_dict["from"]
        if "to" in route_dict:
            route_text += " to " + route_dict["to"]

        res = {
            "route": route_text,
            "direction": route_dict["direction"]

        }
        return res


class EventGeographyField(serializers.Field):
    def to_internal_value(self, data):
        # Hack for points since LineString only accepts double arrays with len > 1
        coordinates = [data["coordinates"], data["coordinates"]] \
            if data["type"] == "Point" else data["coordinates"]
        res = {
            "location": LineString(coordinates),
        }
        return res
