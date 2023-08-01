from apps.event.models import Event
from rest_framework import serializers


class EventSerializer(serializers.ModelSerializer):
    route_display = serializers.SerializerMethodField()

    class Meta:
        model = Event
        exclude = (
            "created_at",
            "modified_at",
        )

    def get_route_display(self, obj):
        res = obj.route_from[3:] if obj.route_from[:3] == "at " else obj.route_from

        if obj.route_to:
            res += " to " + obj.route_to

        return res
