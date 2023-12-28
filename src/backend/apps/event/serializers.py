import datetime

import pytz
from apps.event.enums import (
    EVENT_DIRECTION_DISPLAY,
    EVENT_DISPLAY_CATEGORY,
    EVENT_DISPLAY_CATEGORY_MAP,
    EVENT_SEVERITY,
)
from apps.event.models import Event
from rest_framework import serializers


class ScheduleSerializer(serializers.Serializer):
    intervals = serializers.ListField(
        child=serializers.CharField(),
        required=False, default=[]
    )


class EventSerializer(serializers.ModelSerializer):
    display_category = serializers.SerializerMethodField()
    direction_display = serializers.SerializerMethodField()
    route_display = serializers.SerializerMethodField()
    schedule = ScheduleSerializer()
    severity = serializers.SerializerMethodField()

    class Meta:
        model = Event
        exclude = (
            "created_at",
            "modified_at",
        )

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        schedule = instance.schedule.get('intervals', [])
        if schedule and isinstance(schedule, list):
            start, end = schedule[0].split('/')
            representation['start'] = start
            representation['end'] = end
        return representation

    def get_direction_display(self, obj):
        return EVENT_DIRECTION_DISPLAY[obj.direction]

    def get_route_display(self, obj):
        res = obj.route_from[3:] if obj.route_from[:3] == "at " else obj.route_from

        if obj.route_to:
            res += " to " + obj.route_to

        return res

    def get_display_category(self, obj):
        if obj.closed:
            return EVENT_DISPLAY_CATEGORY.CLOSURE

        if obj.event_sub_type in EVENT_DISPLAY_CATEGORY_MAP:
            return EVENT_DISPLAY_CATEGORY_MAP[obj.event_sub_type]

        if obj.start and datetime.datetime.now(pytz.utc) < obj.start:
            return EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS

        return EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS \
            if obj.severity == EVENT_SEVERITY.MAJOR \
            else EVENT_DISPLAY_CATEGORY.MINOR_DELAYS

    def get_severity(self, obj):
        if obj.closed:
            return 'CLOSURE'

        return obj.severity