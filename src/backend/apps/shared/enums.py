class Region:
    NORTHERN = 0
    SOUTHERN_INTERIOR = 1
    LOWER_MAINLAND = 2
    VANCOUVER_ISLAND = 3
    BORDER_CAMS = 4


REGION_CHOICES = (
    (Region.NORTHERN, 'Northern Interior'),
    (Region.SOUTHERN_INTERIOR, 'Southern Interior'),
    (Region.LOWER_MAINLAND, 'Lower Mainland'),
    (Region.VANCOUVER_ISLAND, 'Vancouver Island'),
    (Region.BORDER_CAMS, 'Border Cams'),
)


class Orientation:
    NORTH = 'N'
    NORTH_EAST = 'NE'
    EAST = 'E'
    SOUTH_EAST = 'SE'
    SOUTH = 'S'
    SOUTH_WEST = 'SW'
    WEST = 'W'
    NORTH_WEST = 'NW'
    NULL = 'NULL'


ORIENTATION_CHOICES = (
    (Orientation.NORTH, 'North'),
    (Orientation.NORTH_EAST, 'North East'),
    (Orientation.EAST, 'East'),
    (Orientation.SOUTH_EAST, 'South East'),
    (Orientation.SOUTH, 'South'),
    (Orientation.SOUTH_WEST, 'South West'),
    (Orientation.WEST, 'West'),
    (Orientation.NORTH_WEST, 'North West'),
    (Orientation.NULL, 'null'),
)


# Caching
class CacheTimeout:
    DEFAULT = 120
    WEBCAM_LIST = 60*7  # 5min buffer + (2*1)min twice of task interval
    EVENT_LIST = 60 * 15  # 5min buffer + (2*5)min twice of task interval
    FERRY_LIST = 60*60*24  # 24hr
    REGIONAL_WEATHER_LIST = 60 * 15 # 5min buffer + (2*5)min twice of task interval


class CacheKey:
    DEFAULT = "default_key"
    WEBCAM_LIST = "webcam_list"
    EVENT_LIST = "event_list"
    ADVISORY_LIST = "advisory_list"
    BULLETIN_LIST = "bulletin_list"
    FERRY_LIST = "ferry_list"
    TEST_APP_CACHE = "test_app_cache"
    REGIONAL_WEATHER_LIST = "regional_weather_list"


ROUTE_FILTER_TOLERANCE = 25
