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
    WEBCAM_LIST = 600
    DELAY_LIST = 600


class CacheKey:
    DEFAULT = "default_key"
    WEBCAM_LIST = "webcam_list"
    DELAY_LIST = "delay_list"
