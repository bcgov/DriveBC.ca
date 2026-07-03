import datetime

from rest_framework import serializers


class WildfireAreaPropertiesField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            # General
            "id": data['FIRE_NUMBER'],
            "size": data['FIRE_SIZE_HECTARES'],
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
            "reported_date": datetime.datetime.strptime(data['IGNITION_DATE'], "%Y-%m-%dZ").date(),
            "size": data['CURRENT_SIZE'],
            "status": data['FIRE_STATUS'],
            "url": data['FIRE_URL'],
        }

        return res
