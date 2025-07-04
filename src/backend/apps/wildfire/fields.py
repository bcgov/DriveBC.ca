import datetime

from rest_framework import serializers


class WildfireAreaPropertiesField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            # General
            "id": data['FIRE_NUMBER'],
            "size": data['FIRE_SIZE_HECTARES'],
            "reported_date": datetime.datetime.strptime(data['TRACK_DATE'], "%Y-%m-%dZ").date(),
            "status": data['FIRE_STATUS'],
            "url": data['FIRE_URL'],
        }

        return res


class WildfirePointPropertiesField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            # General
            "id": data['FIRE_NUMBER'],
            "name": data['INCIDENT_NAME'],
        }

        return res
