import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import requests
from apps.event.enums import (
    EVENT_DIRECTION,
    EVENT_SEVERITY,
    EVENT_STATUS,
    EVENT_SUB_TYPE,
    EVENT_TYPE,
)
from apps.feed.serializers import RIDEEventSerializer
from config.settings import RIDE_EVENT_API_URL
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_gis.fields import GeometryField

logger = logging.getLogger(__name__)

# Mirrors RIDE open511.py mappings
EVENT_TYPE_MAP = {
    'Planned event': EVENT_TYPE.CONSTRUCTION,
    'Incident': EVENT_TYPE.INCIDENT,
    'ROAD_CONDITION': EVENT_TYPE.ROAD_CONDITION,
}

DIRECTION_MAP = {
    'Eastbound': EVENT_DIRECTION.EAST,
    'Westbound': EVENT_DIRECTION.WEST,
    'Northbound': EVENT_DIRECTION.NORTH,
    'Southbound': EVENT_DIRECTION.SOUTH,
    'Both directions': EVENT_DIRECTION.BOTH,
}

# RIDE EVENT_SUBTYPE_GROUPS, situation ids per subtype
SUBTYPE_SITUATIONS = {
    'OBSTRUCTION': [104, 105],
    'HAZARD': [
        72, 76, 77, 78, 79, 80, 81, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 102, 118, 144, 153, 156, 158,
        160, 161, 164, 165, 168, 192, 218, 265, 266, 267, 268, 269, 271, 285, 287, 296, 305,
    ],
    'FIRE': [87, 88, 89, 188, 298],
    'MUD': [103],
    'SIGNAL_LIGHT_FAILURE': [107, 117],
    'AVALANCHE_HAZARD': [84, 86, 283, 292],
    'ROAD_CONSTRUCTION': [10, 11, 12, 191, 226, 282],
    'ROAD_MAINTENANCE': [
        13, 15, 19, 21, 25, 28, 68, 69, 70, 71, 109, 110, 111, 112, 113, 114, 115, 116, 205, 245, 251, 280,
        284, 295, 300,
    ],
    'POOR_VISIBILITY': [106],
    'SPILL': [108],
    'ALMOST_IMPASSABLE': [
        4, 9, 73, 74, 82, 146, 147, 148, 149, 150, 151, 152, 224, 233, 234, 235, 236, 238, 239, 240, 252, 253,
        254, 255, 256, 257, 258, 259, 261, 262, 263, 264, 279, 281, 289, 304,
    ],
    'PLANNED_EVENT': [7],
}


def get_ride_events():
    # DBC22-7577: /relevant has latest approved version; /events latest may be pending approval
    response = requests.get(f'{RIDE_EVENT_API_URL}/relevant')
    response_data = response.json()

    events = []
    for data in response_data:
        if not data.get('latest_approved') or data.get('status') != 'Active':
            continue

        eid = data['id']

        serializer_cls = RIDEChainupSerializer if data['type'] == 'CHAIN_UP' else RIDEEventSerializer
        serializer = serializer_cls(data=data)
        serializer.is_valid(raise_exception=False)

        if len(serializer.errors):
            logger.warning(f'error while serializing ride event data for id {eid}')
            continue

        if data['type'] == 'CHAIN_UP':
            events.append(serializer.validated_data)

        else:
            events.append(get_ride_event_data(data, serializer.validated_data))

    return events


def get_ride_event_sub_type(data):
    situation = data.get('details', {}).get('situation')
    for sub_type, situations in SUBTYPE_SITUATIONS.items():
        if situation in situations:
            return sub_type

    return EVENT_SUB_TYPE.PLANNED_EVENT if data.get('type') == 'Planned event' else EVENT_SUB_TYPE.HAZARD


def parse_ride_datetime_seconds(value):
    # Open511 had second precision; microsecond diffs would mass update/notify on cutover
    dt = parse_ride_iso_datetime(value)
    return dt.replace(microsecond=0) if dt else None


def format_schedule_datetime(value):
    return value.astimezone(ZoneInfo('America/Vancouver')).isoformat(timespec='seconds') if value else ''


def get_ride_event_data(data, ride_fields):
    """Adds fields previously sourced from Open511, built the same way RIDE builds its Open511 payload."""
    details = data.get('details', {})
    start = data.get('location', {}).get('start') or {}
    timing = data.get('timing', {})

    # Bulk road conditions: "Highway 1, between ..."
    segment = data.get('segment')
    road_name = segment['description'].split(', ')[0] if segment and segment.get('description') else 'Other Roads'

    geometry = data.get('geometry') or {}
    location = get_linestring_from_collection(geometry) or \
        next(iter(geometry.get('geometries') or []), None) or \
        {'type': 'Point', 'coordinates': start.get('coords')}

    first_created = parse_ride_datetime_seconds(data.get('created'))
    start_time = parse_ride_datetime_seconds(timing.get('startTime')) or first_created
    end_time = parse_ride_datetime_seconds(timing.get('endTime'))

    return {
        **ride_fields,
        'description': data.get('description', ''),
        'event_type': EVENT_TYPE_MAP.get(data.get('type'), EVENT_TYPE.INCIDENT),
        'event_sub_type': get_ride_event_sub_type(data),
        'status': EVENT_STATUS.ACTIVE,
        'severity': (details.get('severity') or 'Minor').upper(),
        'direction': DIRECTION_MAP.get(details.get('direction'), EVENT_DIRECTION.BOTH),
        'location': location,
        'route_at': ride_fields['route_at'] or road_name,
        'route_from': start.get('ROAD_NAME_FULL') or road_name,
        'route_to': '',
        'first_created': first_created,
        'last_updated': parse_ride_datetime_seconds(data.get('last_updated')),
        'schedule': {'intervals': [f'{format_schedule_datetime(start_time)}/{format_schedule_datetime(end_time)}']},
        'start': start_time,
        'end': end_time,
    }


def parse_ride_iso_datetime(value):
    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    text = value.replace('Z', '+00:00', 1) if isinstance(value, str) else value

    return datetime.fromisoformat(text)


def get_linestring_from_collection(geometry):
    for g in geometry.get('geometries') or []:
        if isinstance(g, dict) and g.get('type') == 'LineString':
            return g


class RIDEChainupSerializer(RIDEEventSerializer):
    """Maps RIDE CHAIN_UP API payloads into EventInternalSerializer-compatible fields."""
    highway_segment_names = serializers.CharField(allow_blank=True)
    location_description = serializers.CharField(allow_blank=True)

    schedule = serializers.JSONField()
    description = serializers.CharField(max_length=1024)
    event_type = serializers.CharField(max_length=32)
    event_sub_type = serializers.CharField(
        max_length=32, required=False, allow_blank=True, default=''
    )
    status = serializers.CharField(max_length=32)
    severity = serializers.CharField(max_length=32)
    direction = serializers.CharField(max_length=32)
    location = GeometryField()
    route_from = serializers.CharField(max_length=128)
    route_to = serializers.CharField(
        max_length=128, required=False, allow_blank=True, default=''
    )
    first_created = serializers.DateTimeField()
    last_updated = serializers.DateTimeField()

    def to_internal_value(self, data):
        payload = {}

        timing = data.get('timing') or {}
        if 'timings' not in data:
            data['timings'] = timing

        line = get_linestring_from_collection(data.get('geometry'))
        if line is None:
            raise ValidationError(
                {'geometry': 'Expected a LineString or GeometryCollection containing a LineString.'}
            )

        payload['id'] = data.get('id')
        payload['location'] = line
        payload['schedule'] = {"intervals": []}

        payload['event_type'] = EVENT_TYPE.CHAIN_UP
        payload['event_sub_type'] = ''
        payload['status'] = EVENT_STATUS.ACTIVE if data.get('status') == 'Active' else EVENT_STATUS.INACTIVE
        payload['severity'] = EVENT_SEVERITY.MINOR \
            if data.get('details', {}).get('severity') == 'Minor' else EVENT_SEVERITY.MAJOR
        payload['direction'] = EVENT_DIRECTION.NONE
        payload['first_created'] = parse_ride_iso_datetime(data.get('created'))
        payload['last_updated'] = parse_ride_iso_datetime(data.get('last_updated'))

        # Parsed from chainup description
        description = data.get('chainup', {}).get('description')
        highway = description.split(', ')[0]
        highway_description = description.split(', ')[1]
        payload['description'] = 'Commercial chain up in effect ' + highway_description + '.'
        payload['route_from'] = data.get('chainup', {}).get('name')
        payload['route_to'] = ''  # Unused on FE

        res = super().to_internal_value(payload)
        res['route_at'] = highway

        # Override these fields
        res["highway_segment_names"] = data.get('chainup', {}).get('name')
        res["location_description"] = data.get('chainup', {}).get('description')

        return res
