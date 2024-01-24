import datetime
import zoneinfo
from collections import OrderedDict

from django.contrib.gis.geos import LineString

parsed_feed = OrderedDict([
    ("location_code", "s0000341"),
    ("location_latitude", "58.66N"),
    ("location_longitude", "124.64W"),
    ("conditions", {
                "condition", "clear",
                "wind_direction", "N",
                "wind_gust_units", "km",
                "wind_gust_value", "16.5",
                "visibility_units", "km",
                "visibility_value", "2.3",
                "wind_speed_units", "km",
                "wind_speed_value", "45",
                "temperature_units", "C",
                "temperature_value", "27",
            },
    )
    
])
