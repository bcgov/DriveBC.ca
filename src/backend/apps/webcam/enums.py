CAMERA_TASK_DEFAULT_TIMEOUT = 480
CAMERA_DIFF_FIELDS = [
    'name',
    'caption',
    'is_on',
    'should_appear',
    'marked_stale',
    'marked_delayed',
    'local_weather_station_id'
]

CAMERA_FIELD_MAPPING = {
    'name': 'cam_internetname',
    'caption': 'cam_internetcaption',
    'is_on': 'cam_controldisabled',
    'should_appear': 'cam_controldisappear',
    'marked_stale': 'stale',
    'marked_delayed': 'delayed',
    'local_weather_station_id': 'cam_locationsweather_station'

}
