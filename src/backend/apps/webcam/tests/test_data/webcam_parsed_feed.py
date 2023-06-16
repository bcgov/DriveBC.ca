import datetime
import zoneinfo
from collections import OrderedDict

from django.contrib.gis.geos import Point

parsed_feed = OrderedDict([
    ('id', 2),
    ('name', 'Coquihalla Great Bear Snowshed - N'),
    ('caption', 'Hwy 5, Great Bear Snowshed looking north.'),
    ('region', 1),
    ('region_name', 'Vancouver Island'),
    ('highway_group', 0),
    ('highway_cam_order', 29),
    ('highway', '5'),
    ('highway_description', 'Vancouver Island'),
    ('location', Point(-121.159832, 49.596374)),
    ('elevation', 980),
    ('orientation', 'N'),
    ('is_on', True),
    ('should_appear', True),
    ('is_new', False),
    ('is_on_demand', False),
    ('marked_stale', False),
    ('marked_delayed', False),
    ('last_update_attempt', datetime.datetime(2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver'))),
    ('last_update_modified', datetime.datetime(2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver'))),
    ('update_period_mean', 899),
    ('update_period_stddev', 12)
])
