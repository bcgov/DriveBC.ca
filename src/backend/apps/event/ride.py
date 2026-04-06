import logging
from datetime import datetime

import requests
from apps.event.enums import EVENT_DIRECTION, EVENT_SEVERITY, EVENT_STATUS, EVENT_TYPE
from apps.feed.serializers import RIDEEventSerializer
from config.settings import RIDE_EVENT_API_URL
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_gis.fields import GeometryField

logger = logging.getLogger(__name__)


def get_ride_event_dict():
    response = requests.get(RIDE_EVENT_API_URL)
    response_data = response.json()

    events = {}
    chainups = []
    for data in response_data:
        eid = data['id']

        serializer_cls = RIDEChainupSerializer if data['type'] == 'CHAIN_UP' else RIDEEventSerializer
        serializer = serializer_cls(data=data)
        serializer.is_valid(raise_exception=False)

        if len(serializer.errors):
            logger.warning(f'error while serializing ride event data for id {eid}')
            continue

        if data['type'] == 'CHAIN_UP':
            chainups.append(serializer)

        else:
            events[eid] = data

    return events, chainups


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
