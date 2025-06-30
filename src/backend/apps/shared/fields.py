from django.utils.html import strip_tags
from rest_framework import serializers


class SafeStringField(serializers.CharField):
    '''
    A field that strips HTML from string content, incoming and outgoing

    Currently only runs Django's strip_tags on input/output.
    '''

    def to_internal_value(self, data):
        data = super().to_internal_value(data)
        return strip_tags(data)

    def to_representation(self, value):
        value = super().to_representation(value)
        return strip_tags(value)


class DistrictPropertiesField(serializers.Field):
    def to_internal_value(self, data):
        res = {
            # General
            "id": data['DISTRICT_NUMBER'],
            "name": data['DISTRICT_NAME'],
        }

        return res
