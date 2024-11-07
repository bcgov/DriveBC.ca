from django.utils.html import strip_tags
from rest_framework import serializers


class SafeStringField(serializers.CharField):
    '''
    A field that strips HTML from string content, incoming and outgoing

    Currently only runs Django's strip_tags on input/output.
    '''

    def to_internal_value(self, data):
        return strip_tags(data)

    def to_representation(self, value):
        return strip_tags(value)
