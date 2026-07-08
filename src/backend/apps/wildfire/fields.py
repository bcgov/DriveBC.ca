import datetime

from apps.wildfire.enums import WILDFIRE_STATUS
from django.contrib.gis.geos import Point
from rest_framework import serializers


class WildfireAreaPropertiesField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            # General
            "id": data['FIRE_NUMBER'],
            "size": data['FIRE_SIZE_HECTARES'],
            "url": data['FIRE_URL'],
        }

        return res


class WildfirePointGeometryField(serializers.Field):
    def to_internal_value(self, data):
        return Point(float(data['longitude']), float(data['latitude']))


class WildfirePointPropertiesField(serializers.Field):
    def to_internal_value(self, data):
        incident_number = data['incidentNumberLabel']
        discovery_date = datetime.datetime.fromtimestamp(
            data['discoveryDate'] / 1000,
            tz=datetime.timezone.utc,
        ).date()

        return {
            "id": incident_number,
            "name": data['incidentName'],
            "reported_date": discovery_date,
            "wildfire_of_note": bool(data.get('fireOfNoteInd')),
            # Defensive, map won't show 'Out' fires
            "status": getattr(WILDFIRE_STATUS, data['stageOfControlCode'], WILDFIRE_STATUS.OUT),
        }
