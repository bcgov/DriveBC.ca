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

    def to_representation(self, value):
        return super().to_representation(value[self.custom_field_name])


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

    def to_representation(self, value):
        return super().to_representation(value[self.custom_field_name])


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
            # "route_at": data["name"],
            # "route_from": data["from"],
            # "route_to": data["to"] if "to" in data else "",
            # "direction": data["direction"]
        }
        return res

    def to_representation(self, value):
        return f'{value["route_from"]} to {value["route_to"]}, {value["direction"]}'


class EventGeographyField(DriveBCField, GeometryField):
    pass


# Ferry
class FerryPropertiesField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            # General
            "id": data['VESSEL_ID'],
            "name": data['VESSEL_NAME'] or '',
            "route_id": data['FERRY_ROUTE_ID'],
            "route_name": data['FERRY_ROUTE_NAME'] or '',
            "route_description": data['ROUTE_LOCATION_DESCRIPTION'] or '',

            # Urls
            "url": data['ROUTE_OVERVIEW_URL'] or '',
            "image_url": data['VESSEL_IMAGE_URL'] or '',
            "route_image_url": data['ROUTE_MAP_IMAGE_URL'] or '',

            # Capacity
            "vehicle_capacity": data['VESSEL_VEHICLE_CAPACITY'],
            "passenger_capacity": data['VESSEL_PASSENGER_CAPACITY'],
            "crossing_time_min": data['CROSSING_TIME_MIN'],
            "weight_capacity_kg": data['VESSEL_WEIGHT_CAPACITY_KG'],

            # Schedule
            "schedule_type": data['SCHEDULE_TYPE'] or '',
            "schedule_detail": data['SCHEDULE_DETAIL'] or '',
            "special_restriction": data['SPECIAL_RESTRICTION'] if (
                    data['SPECIAL_RESTRICTION'] and
                    data['SPECIAL_RESTRICTION'] != 'None'
            ) else '',

            # Contacts
            "contact_org": data['ROUTE_CONTACT_ORGANIZATION'] or '',
            "contact_phone": str(data['ROUTE_CONTACT_OFFICE_PHONE']) if data['ROUTE_CONTACT_OFFICE_PHONE'] else '',
            "contact_alt_phone": str(data['ROUTE_CONTACT_ALTERNATE_PHONE']) if data['ROUTE_CONTACT_ALTERNATE_PHONE'] else '',
            "contact_fax": str(data['ROUTE_CONTACT_FAX']) if data['ROUTE_CONTACT_FAX'] else '',
            "contact_email": str(data['ROUTE_CONTACT_EMAIL']) if data['ROUTE_CONTACT_EMAIL'] else '',
            "contact_url_1": str(data['ROUTE_CONTACT_URL_1']) if data['ROUTE_CONTACT_URL_1'] else '',
            "contact_url_2": str(data['ROUTE_CONTACT_URL_2']) if data['ROUTE_CONTACT_URL_2'] else '',

            # Webcams
            "webcam_url_1": data['WEBCAM_URL_1'] or '',
            "webcam_url_2": data['WEBCAM_URL_2'] or '',
            "webcam_url_3": data['WEBCAM_URL_3'] or '',
            "webcam_url_4": data['WEBCAM_URL_4'] or '',
            "webcam_url_5": data['WEBCAM_URL_5'] or '',

            # Meta
            "feed_created_at": data['DB_CREATE_TIMESTAMP'],
            "feed_modified_at": data['DB_LAST_UPDATE_TIMESTAMP'],
        }

        return res


class FerryGeographyField(DriveBCField, GeometryField):
    pass


# Regional Weather
class RegionalWeatherPropertiesField(serializers.Field):
    pass
