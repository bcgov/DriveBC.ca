class EVENT_TYPE:
    CONSTRUCTION = "CONSTRUCTION"
    INCIDENT = "INCIDENT"
    SPECIAL_EVENT = "SPECIAL_EVENT"
    WEATHER_CONDITION = "WEATHER_CONDITION"
    ROAD_CONDITION = "ROAD_CONDITION"


EVENT_TYPE_CHOICES = (
    (EVENT_TYPE.CONSTRUCTION, "Construction"),
    (EVENT_TYPE.INCIDENT, "Incident"),
    (EVENT_TYPE.SPECIAL_EVENT, "Special event"),
    (EVENT_TYPE.WEATHER_CONDITION, "Weather condition"),
    (EVENT_TYPE.ROAD_CONDITION, "Road condition"),
)


class EVENT_SUB_TYPE:
    ALMOST_IMPASSABLE = "ALMOST_IMPASSABLE"
    FIRE = "FIRE"
    HAZARD = "HAZARD"
    ROAD_CONSTRUCTION = "ROAD_CONSTRUCTION"
    ROAD_MAINTENANCE = "ROAD_MAINTENANCE"
    PARTLY_ICY = "PARTLY_ICY"
    ICE_COVERED = "ICE_COVERED"
    SNOW_PACKED = "SNOW_PACKED"
    PARTLY_SNOW_PACKED = "PARTLY_SNOW_PACKED"
    MUD = "MUD"
    PLANNED_EVENT = "PLANNED_EVENT"
    POOR_VISIBILITY = "POOR_VISIBILITY"
    PARTLY_SNOW_COVERED = "PARTLY_SNOW_COVERED"
    DRIFTING_SNOW = "DRIFTING_SNOW"
    PASSABLE_WITH_CARE = "PASSABLE_WITH_CARE"


EVENT_SUB_TYPE_CHOICES = (
    (EVENT_SUB_TYPE.ALMOST_IMPASSABLE, "Almost Impassable"),
    (EVENT_SUB_TYPE.FIRE, "Fire"),
    (EVENT_SUB_TYPE.HAZARD, "Hazard"),
    (EVENT_SUB_TYPE.ROAD_CONSTRUCTION, "Road construction"),
    (EVENT_SUB_TYPE.ROAD_MAINTENANCE, "Road maintenance"),
    (EVENT_SUB_TYPE.PARTLY_ICY, "Partly Icy"),
    (EVENT_SUB_TYPE.ICE_COVERED, "Ice Covered"),
    (EVENT_SUB_TYPE.SNOW_PACKED, "Snow Packed"),
    (EVENT_SUB_TYPE.PARTLY_SNOW_PACKED, "Partly Snow Packed"),
    (EVENT_SUB_TYPE.MUD, "Mud"),
    (EVENT_SUB_TYPE.PLANNED_EVENT, "Planned event"),
    (EVENT_SUB_TYPE.POOR_VISIBILITY, "Poor visibility"),
)


class EVENT_STATUS:
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


EVENT_STATUS_CHOICES = ((EVENT_STATUS.ACTIVE, "Active"),)


class EVENT_SEVERITY:
    MAJOR = "MAJOR"
    MINOR = "MINOR"


EVENT_SEVERITY_CHOICES = (
    (EVENT_SEVERITY.MAJOR, "Major"),
    (EVENT_SEVERITY.MINOR, "Minor"),
)


class EVENT_DIRECTION:
    NORTH = "N"
    EAST = "E"
    SOUTH = "S"
    WEST = "W"
    BOTH = "BOTH"
    NONE = "NONE"


EVENT_DIRECTION_CHOICES = (
    (EVENT_DIRECTION.NORTH, "North"),
    (EVENT_DIRECTION.EAST, "East"),
    (EVENT_DIRECTION.SOUTH, "South"),
    (EVENT_DIRECTION.WEST, "West"),
    (EVENT_DIRECTION.BOTH, "Both"),
    (EVENT_DIRECTION.NONE, "None"),
)


EVENT_DIRECTION_DISPLAY = {
    EVENT_DIRECTION.NORTH: "Northbound",
    EVENT_DIRECTION.EAST: "Eastbound",
    EVENT_DIRECTION.SOUTH: "Southbound",
    EVENT_DIRECTION.WEST: "Westbound",
    EVENT_DIRECTION.BOTH: "Both directions",
    EVENT_DIRECTION.NONE: "Both directions"
}

EVENT_DIFF_FIELDS = [
    'last_updated',
]

EVENT_UPDATE_FIELDS = [
    'highway_segment_names',
    'location_description',
    'closest_landmark',
    'next_update',
    'start_point_linear_reference',
    'description',
    'event_type',
    'status',
    'severity',
    'closed',
    'direction',
    'last_updated',
    'location',
    'route_at',
    'route_from',
    'route_to',
    'schedule',
    'start',
    'end',
]


class EVENT_DISPLAY_CATEGORY:
    ADVISORY = 'advisories'
    CLOSURE = 'closures'
    MAJOR_DELAYS = 'majorEvents'
    MINOR_DELAYS = 'minorEvents'
    FUTURE_DELAYS = 'futureEvents'
    ROAD_CONDITION = 'roadConditions'
    CHAIN_UP = 'chainUps'


EVENT_DISPLAY_CATEGORY_TITLE = {
    EVENT_DISPLAY_CATEGORY.ADVISORY: "advisories",
    EVENT_DISPLAY_CATEGORY.CLOSURE: "closures",
    EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS: "major delays",
    EVENT_DISPLAY_CATEGORY.MINOR_DELAYS: "minor delays",
    EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS: "future delays",
    EVENT_DISPLAY_CATEGORY.ROAD_CONDITION: "road conditions",
    EVENT_DISPLAY_CATEGORY.CHAIN_UP: "chain ups"
}
