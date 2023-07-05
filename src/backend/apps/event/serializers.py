from apps.event.models import Event
from rest_framework import serializers


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        exclude = (
            "created_at",
            "modified_at",
        )
