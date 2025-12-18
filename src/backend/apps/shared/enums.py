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
    # Manually entered so we have short 30 second TTL to ensure that updates get out quickly
    ADVISORY_LIST = 30
    BULLETIN_LIST = 30
    EMERGENCY_ALERT_LIST = 30

    # Huey JOB-BASED TIMEOUTS. Cache timeouts are set to double the task interval to allow for delays.
    # 1 MINUTE TASKS (Interval x 2)
    WEBCAM_LIST = 30 # Cache is automatically invalidated after job runs. However image consumer constantly ingests images so need to keep it short
    WEBCAM_INDIVIDUAL = 60 * 1 # Individual webcams are not automatically invalidated, so keep TTL short
    EVENT_LIST = 60 * 2 # Cache is automatically invalidated after job runs
    EVENT_LIST_POLLING = 60 * 2 # Cache is automatically invalidated after job runs
    EVENT_INDIVUDAL = 60 * 1 # Individual events are not automatically invalidated, so keep TTL short
    BORDER_CROSSING_LIST = 60 * 2 # Cache is automatically invalidated after job runs

    # 10 MINUTE TASKS (Interval x 2)
    REGIONAL_WEATHER_LIST = 60 * 20 # Cache is automatically invalidated after job runs
    CURRENT_WEATHER_LIST = 60 * 20 # Cache is automatically invalidated after job runs
    HIGH_ELEVATION_LIST = 60 * 20 # Cache is automatically invalidated after job runs

    # 15 MINUTE TASKS (Interval x 2)
    WILDFIRE_LIST = 60 * 30 # Cache is automatically invalidated after job runs

    # 1 HOUR TASKS (Interval x 2)
    FERRY_LIST = 60 * 60 * 2 # Cache is automatically invalidated after job runs

    # 24 HOUR TASKS (Interval x 2)
    REST_STOP_LIST = 60 * 60 * 48 # Cache is automatically invalidated after job runs

    # WEEKLY TASKS (Interval x 2)
    DISTRICT_LIST = 60 * 60 * 24 * 14 # Cache is automatically invalidated after job runs
    COASTAL_FERRY_LIST = 60 * 60 * 24 * 14 # Cache is automatically invalidated after job runs


class CacheKey:
    DEFAULT = "default_key"
    WEBCAM_LIST = "webcam_list"
    EVENT_LIST = "event_list"
    EVENT_LIST_POLLING = "event_list_polling"
    ADVISORY_LIST = "advisory_list"
    BULLETIN_LIST = "bulletin_list"
    EMERGENCY_ALERT_LIST = "emergency_alert_list"
    FERRY_LIST = "ferry_list"
    COASTAL_FERRY_LIST = "coastal_ferry_list"
    TEST_APP_CACHE = "test_app_cache"
    REGIONAL_WEATHER_LIST = 'regional_weather_list'
    CURRENT_WEATHER_LIST = 'current_weather_list'
    HIGH_ELEVATION_LIST = 'high_elevation_list'
    REST_STOP_LIST = "rest_stop_list"
    WILDFIRE_LIST = "wildfire_list"
    BORDER_CROSSING_LIST = 'border_crossing_list'
    DISTRICT_LIST = 'district_list'
    


ROUTE_FILTER_TOLERANCE = 25


class FeedbackSubject:
    WEBSITE_FEEDBACK = 0
    WEBSITE_PROBLEM_OR_BUG = 1
    WEBCAM_NOT_WORKING_OR_DELAYED = 2
    HIGHWAY_OR_BRIDGE_PROBLEM = 3


SUBJECT_CHOICES = (
    (FeedbackSubject.WEBSITE_FEEDBACK, 'Website Feedback'),
    (FeedbackSubject.WEBSITE_PROBLEM_OR_BUG, 'Website problem or bug'),
    (FeedbackSubject.WEBCAM_NOT_WORKING_OR_DELAYED, 'Webcam not working or delayed'),
    (FeedbackSubject.HIGHWAY_OR_BRIDGE_PROBLEM, 'Highway or bridge problem'),
)


SUBJECT_TITLE = {
    FeedbackSubject.WEBSITE_FEEDBACK: 'Website Feedback',
    FeedbackSubject.WEBSITE_PROBLEM_OR_BUG: 'Website problem or bug',
    FeedbackSubject.WEBCAM_NOT_WORKING_OR_DELAYED: 'Webcam not working or delayed',
    FeedbackSubject.HIGHWAY_OR_BRIDGE_PROBLEM: 'Highway or bridge problem',
}
