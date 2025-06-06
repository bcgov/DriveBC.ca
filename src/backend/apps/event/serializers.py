import datetime
import html
from zoneinfo import ZoneInfo

from apps.event.enums import EVENT_DIRECTION_DISPLAY
from apps.event.models import Event
from django.contrib.gis.geos import Point
from rest_framework import serializers


class ScheduleSerializer(serializers.Serializer):
    intervals = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )

    recurring_schedules = serializers.ListField(
        required=False
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
    res = res.split('. ')
    if len(res) > 1:
        res = res[1:]

    # Remove 'at' location phrases from the beginning
    res[0] = tail_trim(res[0], ' at')

    # Remove 'between' location phrases from the beginning
    res[0] = tail_trim(res[0], ' between')

    # Join split strings and return
    return '. '.join(res) if len(res) > 1 else res[0] + '.'


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
        return obj.display_category


class EventSerializer(EventInternalSerializer):
    severity = serializers.SerializerMethodField()

    def get_severity(self, obj):
        if obj.closed:
            return 'CLOSURE'

        return obj.severity


class LocationField(serializers.Field):
    def to_representation(self, value):
        if isinstance(value, Point):
            return {
                'type': 'Point',
                'coordinates': [value.x, value.y]
            }
        return None


class EventPollingSerializer(EventSerializer):
    location = LocationField()

    class Meta:
        model = Event
        exclude = (
            "created_at",
            "modified_at",
            "polygon"
        )


def first_item(value, default=None):
    '''
    Return the first element of value if value is a list.

    If the list is empty, return default. if value is not a list, return value.
    '''

    if isinstance(value, (list, tuple)):
        return value[0] if value else default
    return value


class CarsEventSerializer(EventInternalSerializer):
    '''
    A serializer to turn a CARS API event into a model Event

    Currently handles only against chain up events; does NOT fully implement the
    Open511 ETL's logic.  Specifically, does not set severity or direction
    according to CARS data.
    '''

    def to_internal_value(self, data):
        open511 = data.get('open511-event-details', {})
        # use first object from details array
        details = first_item(data.get('details', []), {})
        # use first object from locations array
        location = first_item(details.get('locations', []), {})

        data['id'] = data['event-id']
        data['event_type'] = open511.get('event_type_description')
        data['event_subtype'] = open511.get('event_subtype')
        data['status'] = 'ACTIVE'
        data['severity'] = 'MINOR'
        data['closed'] = False
        data['direction'] = 'NONE'
        data['location'] = data.get('geometry')
        data['route_at'] = location.get('route-designator')
        data['route_from'] = open511.get('event_road_from')
        data['route_to'] = open511.get('event_road_to')
        segments = location.get('segment-names')
        data['highway_segment_names'] = segments[0] if segments else None
        data['schedule'] = {}

        # Data under 'communication-plans'
        for plan in data.get('communication-plans', []):
            plan_type = plan.get('plan-type')

            if plan_type == 'BRIEF_LOCATION':
                data['location_description'] = html.unescape(plan.get('description', ''))
            elif plan_type == 'OPERATOR':
                data['description'] = plan.get('description')

        template = data.get('communication-plan-template', {})
        data['location_extent'] = template.get('extent-event-length', '')
        data['closest_landmark'] = html.unescape(template.get('nearby-city-reference', ''))

        data['start_point_linear_reference'] = float(open511.get('start_point_linear_reference')) \
            if 'start_point_linear_reference' in open511 else None

        if 'update-time' in data:
            update = data.get('update-time')
            data['last_updated'] = datetime.datetime.fromtimestamp(
                update['time'] // 1000,
                tz=ZoneInfo(key=update['timeZoneId'])
            )

        # CARS API does not offer any time of creation, or start/end times
        data['first_created'] = data['last_updated']
        first_created = data['first_created']
        if first_created and first_created.tzinfo:
            data['timezone'] = first_created.tzinfo.key
        data['start'] = data['last_updated']

        if 'next-update-time' in data:
            next_update = data.get('next-update-time')
            data['next_update'] = datetime.fromtimestamp(
                next_update['time'] // 1000,
                tz=ZoneInfo(key=next_update['timeZoneId'])
            )

        return super().to_internal_value(data)
