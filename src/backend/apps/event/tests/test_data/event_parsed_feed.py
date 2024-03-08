import datetime
import zoneinfo
from collections import OrderedDict

from django.contrib.gis.geos import LineString, Point

parsed_feed = OrderedDict([
    ("id", "DBC-52446"),
    ("description", "Highway 3. Road maintenance work between Bromley Pl "
                    "and Frontage Rd for 0.6 km (Princeton). Until Sat "
                    "Jul 22 at 7:00 AM PDT. Single lane alternating traffic. "
                    "Next update time Fri Jul 21 at 1:00 PM PDT. "
                    "Last updated Thu Jun 29 at 10:14 AM PDT. (DBC-52446)"),
    ("event_type", "CONSTRUCTION"),
    ("event_sub_type", "ROAD_MAINTENANCE"),
    ("status", "ACTIVE"),
    ("severity", "MAJOR"),
    ("route_at", "Highway 3"),
    ("route_from", "Bromley Pl"),
    ("route_to", "Frontage Rd"),
    ("direction", "NONE"),
    ("location", LineString([
        [-120.528796, 49.446318],
        [-120.528342, 49.447589],
        [-120.527977, 49.448609],
        [-120.527803, 49.449096],
        [-120.527031, 49.450689],
        [-120.526853, 49.451003],
        [-120.526427, 49.451752]
    ])),
    ("first_created", datetime.datetime(
        2023, 5, 19, 14, 29, 20, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
    )),
    ("last_updated", datetime.datetime(
        2023, 6, 29, 10, 14, 55, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
    )),
    ("priority", 7),
    ("schedule", {"intervals": ["2023-05-23T14:00/2023-07-22T14:00"]})
])

parsed_feed_2 = OrderedDict([
    ("id", "DBC-52446"),
    ("description", "Highway 3. Road maintenance work between Bromley Pl "
                    "and Frontage Rd for 0.6 km (Princeton). Until Sat "
                    "Jul 22 at 7:00 AM PDT. Single lane alternating traffic. "
                    "Next update time Fri Jul 21 at 1:00 PM PDT. "
                    "Last updated Thu Jun 29 at 10:14 AM PDT. (DBC-52446)"),
    ("event_type", "CONSTRUCTION"),
    ("event_sub_type", "ROAD_MAINTENANCE"),
    ("status", "ACTIVE"),
    ("severity", "MAJOR"),
    ("route_at", "Highway 3"),
    ("route_from", "Bromley Pl"),
    ("route_to", "Frontage Rd"),
    ("direction", "NONE"),
    ("location", Point(-120.526427, 49.451752)),
    # ("location", {"coordinates": [-120.526427, 49.451752]})
    ("coordinates", [-120.526427, 49.451752]),
    ("first_created", datetime.datetime(
        2023, 5, 19, 14, 29, 20, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
    )),
    ("last_updated", datetime.datetime(
        2023, 6, 29, 10, 14, 55, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
    )),
    ("priority", 7),
    ("schedule", {"intervals": ["2023-05-23T14:00/2023-07-22T14:00"]})
])
