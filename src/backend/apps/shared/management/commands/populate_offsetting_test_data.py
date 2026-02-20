from datetime import datetime, timezone

from apps.border.models import BorderCrossing
from apps.dms.models import Dms
from apps.event.enums import EVENT_DIRECTION, EVENT_SEVERITY, EVENT_STATUS, EVENT_TYPE
from apps.event.models import Event
from apps.ferry.models import Ferry
from apps.rest.models import RestStop
from apps.weather.models import CurrentWeather
from django.contrib.gis.geos import LineString, Point
from django.core.management import call_command
from django.core.management.base import BaseCommand

# Near "Tzoonie Mountain" where there is no features
CENTER_LON = -123.6429
CENTER_LAT = 49.7985

NOW = datetime.now(timezone.utc)

# 1 degree of latitude ≈ 111,320m at this latitude
# Approximate degree offsets for target distances:
OFFSET_45M = 0.000404    # ~45m  — just inside 50m tolerance
OFFSET_55M = 0.000494    # ~55m  — just outside 50m tolerance
OFFSET_100M = 0.000898   # ~100m
OFFSET_500M = 0.004491   # ~500m
OFFSET_2KM = 0.01797     # ~2km


class Command(BaseCommand):
    help = 'Generate test point features near Lougheed & Willingdon for overlap offset testing'

    def handle(self, *args, **options):
        call_command('clear_cache')
        call_command('clean_offsetting_test_data')

        count = 0
        count += self._create_clustered_features()
        count += self._create_exact_overlaps()
        count += self._create_boundary_distance_features()
        count += self._create_distant_features()
        count += self._create_linestring_event()
        self.stdout.write(self.style.SUCCESS(
            f'Created {count} test features for offset testing'
        ))

    def _pt(self, lon_offset=0, lat_offset=0):
        return Point(CENTER_LON + lon_offset, CENTER_LAT + lat_offset, srid=4326)

    # ── Cluster: features within ~20m of center (should all group together) ──

    def _create_clustered_features(self):
        base = dict(
            route_at='Lougheed Hwy',
            route_from='Willingdon Ave',
            first_created=NOW,
            last_updated=NOW,
        )

        Event.objects.create(
            id='TEST-CLOSURE-1',
            description='Test closure at Lougheed & Willingdon',
            event_type=EVENT_TYPE.INCIDENT,
            status=EVENT_STATUS.ACTIVE,
            severity=EVENT_SEVERITY.MAJOR,
            direction=EVENT_DIRECTION.EAST,
            closed=True,
            location=self._pt(),
            **base,
        )
        Event.objects.create(
            id='TEST-MAJOR-1',
            description='Test major delay at Lougheed & Willingdon',
            event_type=EVENT_TYPE.INCIDENT,
            status=EVENT_STATUS.ACTIVE,
            severity=EVENT_SEVERITY.MAJOR,
            direction=EVENT_DIRECTION.EAST,
            location=self._pt(0.0001),
            **base,
        )

        Dms.objects.create(
            id='TEST-DMS-EB',
            name='Lougheed Hwy EB at Willingdon',
            roadway_direction='Eastbound',
            location=self._pt(0.0002),
        )

        BorderCrossing.objects.create(
            id=9901, name='Test Crossing Alpha',
            location=self._pt(0.00005),
        )

        Ferry.objects.create(
            id=9901, route_id=9901, name='Test Ferry Alpha',
            location=self._pt(0.00015),
        )

        CurrentWeather.objects.create(
            weather_station_name='Test Weather Lougheed',
            location_longitude=CENTER_LON + 0.00008,
            location_latitude=CENTER_LAT + 0.00008,
        )

        return 6

    # ── Exact overlaps: multiple features at the exact same coordinates ──

    def _create_exact_overlaps(self):
        Event.objects.create(
            id='TEST-OVERLAP-A',
            description='Exact overlap event A',
            event_type=EVENT_TYPE.INCIDENT,
            status=EVENT_STATUS.ACTIVE,
            severity=EVENT_SEVERITY.MAJOR,
            direction=EVENT_DIRECTION.WEST,
            route_at='Lougheed Hwy', route_from='Willingdon Ave',
            location=self._pt(),
            first_created=NOW, last_updated=NOW,
        )
        Dms.objects.create(
            id='TEST-DMS-OVERLAP',
            name='DMS at exact same point as center',
            roadway_direction='Eastbound',
            location=self._pt(),
        )
        BorderCrossing.objects.create(
            id=9903, name='Test Crossing at exact center',
            location=self._pt(),
        )

        return 3

    # ── Boundary: features near the 50m tolerance edge ──

    def _create_boundary_distance_features(self):
        base = dict(
            route_at='Lougheed Hwy',
            route_from='Willingdon Ave',
            first_created=NOW,
            last_updated=NOW,
        )

        # ~45m north — just inside tolerance, should be grouped with center
        Event.objects.create(
            id='TEST-45M-INSIDE',
            description='Event 45m north (inside tolerance)',
            event_type=EVENT_TYPE.INCIDENT,
            status=EVENT_STATUS.ACTIVE,
            severity=EVENT_SEVERITY.MINOR,
            direction=EVENT_DIRECTION.EAST,
            location=self._pt(0, OFFSET_45M),
            **base,
        )

        # ~55m south — just outside tolerance, should NOT be grouped with center
        Event.objects.create(
            id='TEST-55M-OUTSIDE',
            description='Event 55m south (outside tolerance)',
            event_type=EVENT_TYPE.INCIDENT,
            status=EVENT_STATUS.ACTIVE,
            severity=EVENT_SEVERITY.MINOR,
            direction=EVENT_DIRECTION.EAST,
            location=self._pt(0, -OFFSET_55M),
            **base,
        )

        # ~45m east — just inside tolerance
        Dms.objects.create(
            id='TEST-DMS-45M',
            name='DMS 45m east (inside tolerance)',
            roadway_direction='Eastbound',
            location=self._pt(OFFSET_45M),
        )

        # ~55m west — just outside tolerance
        Dms.objects.create(
            id='TEST-DMS-55M',
            name='DMS 55m west (outside tolerance)',
            roadway_direction='Westbound',
            location=self._pt(-OFFSET_55M),
        )

        return 4

    # ── Distant: isolated features at 100m, 500m, and 2km ──

    def _create_distant_features(self):
        # ~100m east — clearly separate from center cluster
        Dms.objects.create(
            id='TEST-DMS-100M',
            name='DMS 100m east',
            roadway_direction='Eastbound',
            location=self._pt(OFFSET_100M),
        )

        # ~500m north — isolated
        CurrentWeather.objects.create(
            weather_station_name='Test Weather 500m north',
            location_longitude=CENTER_LON,
            location_latitude=CENTER_LAT + OFFSET_500M,
        )

        # ~500m southwest — isolated
        RestStop.objects.create(
            rest_stop_id='TEST-RS-500M',
            geometry={'type': 'Point', 'coordinates': [
                CENTER_LON - OFFSET_500M * 0.7,
                CENTER_LAT - OFFSET_500M * 0.7,
            ]},
            properties={
                'REST_STOP_NAME': 'Test Rest Stop 500m SW',
                'DIRECTION_OF_TRAFFIC': 'Westbound',
                'ACCOM_COMMERCIAL_TRUCKS': 'No',
            },
        )

        # ~2km northwest — far away, completely isolated
        Ferry.objects.create(
            id=9903, route_id=9903, name='Test Ferry 2km NW',
            location=self._pt(-OFFSET_2KM * 0.7, OFFSET_2KM * 0.7),
        )

        # ~2km southeast — far away, completely isolated
        BorderCrossing.objects.create(
            id=9904, name='Test Crossing 2km SE',
            location=self._pt(OFFSET_2KM * 0.7, -OFFSET_2KM * 0.7),
        )

        return 5

    # ── LineString event: line geometry should be skipped, midpoint icon collected ──

    def _create_linestring_event(self):
        line = LineString(
            (CENTER_LON - 0.002, CENTER_LAT),
            (CENTER_LON + 0.002, CENTER_LAT),
            srid=4326,
        )
        Event.objects.create(
            id='TEST-LINE-EVENT',
            description='Test linestring event along Lougheed',
            event_type=EVENT_TYPE.INCIDENT,
            status=EVENT_STATUS.ACTIVE,
            severity=EVENT_SEVERITY.MAJOR,
            direction=EVENT_DIRECTION.EAST,
            route_at='Lougheed Hwy', route_from='Willingdon Ave',
            location=line,
            first_created=NOW, last_updated=NOW,
        )

        return 1
