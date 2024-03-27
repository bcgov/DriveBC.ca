from apps.rest.models import RestStop
from rest_framework import serializers


class RestStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestStop
        exclude = ['geometry']
