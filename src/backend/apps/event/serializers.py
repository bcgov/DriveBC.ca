import datetime

import pytz
from apps.event.enums import (
    EVENT_DIRECTION_DISPLAY,
    EVENT_DISPLAY_CATEGORY,
    EVENT_SEVERITY,
)
from apps.event.models import Event
from rest_framework import serializers


class ScheduleSerializer(serializers.Serializer):
    intervals = serializers.ListField(
        child=serializers.CharField(),
        required=False, default=[]
    )

    recurring_schedules = serializers.ListField(
        required=False, default=[]
    )


def tail_trim(text, target):
    target_index = text.find(target)
    return text[:target_index] if target_index != -1 else text


def optimize_description(text):
    res = text

    # Remove next update from the end
    res = tail_trim(res, ' Next update')

    # Remove last updated from the end
    res = tail_trim(res, ' Last updated')

    # Split by periods and remove road+directions
    res = res.split('. ')[1:]

    # Remove 'at' location phrases from the beginning
    res[0] = tail_trim(res[0], ' at')

    # Remove 'between' location phrases from the beginning
    res[0] = tail_trim(res[0], ' between')

    # Join split strings and return
    return '. '.join(res) if len(res) > 1 else res[0] + '.'


def parse_recurring_datetime(date_string, time_string):
    # Parse the date and time strings into datetime objects
    date = datetime.datetime.strptime(date_string, "%Y-%m-%d").date()
    time = datetime.datetime.strptime(time_string, "%H:%M").time()

    # Combine the date and time into a single datetime object
    dt = datetime.datetime.combine(date, time)

    # Create a timezone object for Pacific Time
    pacific = pytz.timezone('US/Pacific')

    # Convert the datetime object to Pacific Time
    dt_pacific = pacific.localize(dt)

    return dt_pacific


class EventInternalSerializer(serializers.ModelSerializer):
    display_category = serializers.SerializerMethodField()
    direction_display = serializers.SerializerMethodField()
    route_display = serializers.SerializerMethodField()
    optimized_description = serializers.SerializerMethodField()
    schedule = ScheduleSerializer()

    class Meta:
        model = Event
        exclude = (
            "created_at",
            "modified_at",
        )

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        schedule = instance.schedule.get('intervals', [])
        if len(schedule):
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

    def get_optimized_description(self, obj):
        return optimize_description(obj.description)

    def get_display_category(self, obj):
        if obj.start and datetime.datetime.now(pytz.utc) < obj.start:
            return EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS

        if 'recurring_schedules' in obj.schedule and len(obj.schedule['recurring_schedules']):
            recurring_schedules = obj.schedule['recurring_schedules'][0]
            start_datetime = parse_recurring_datetime(
                recurring_schedules['start_date'],
                recurring_schedules['daily_start_time']
            )

            if datetime.datetime.now(pytz.utc) < start_datetime:
                return EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS

        if obj.closed:
            return EVENT_DISPLAY_CATEGORY.CLOSURE

        if obj.id.startswith('DBCRCON'):
            return EVENT_DISPLAY_CATEGORY.ROAD_CONDITION

        return EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS \
            if obj.severity == EVENT_SEVERITY.MAJOR \
            else EVENT_DISPLAY_CATEGORY.MINOR_DELAYS


class EventSerializer(EventInternalSerializer):
    severity = serializers.SerializerMethodField()

    def get_severity(self, obj):
        if obj.closed and self.get_display_category(obj) != EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS:
            return 'CLOSURE'

        return obj.severity
