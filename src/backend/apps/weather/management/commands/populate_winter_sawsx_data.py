from apps.weather.tasks import populate_local_weather_from_data
from django.core.management.base import BaseCommand

test_feed = {
    "weather_station_name": "Test Winter SAWSx data station",
    "elevation": 496,
    "location_description": "W side of Hwy99, 11 km S of Whistler Creek",
    "datasets": {
        "air_temperature": {"value": "26.17", "unit": "°C"},
        "precipitation": {"value": "0", "unit": "mm"},
        "wind_direction": {"value": "227.4", "unit": "°"},
        "average_wind": {"value": "9.17", "unit": "km/h"},
        "maximum_wind": {"value": "22.86", "unit": "km/h"}
    },
    "location_longitude": -122.74840070168993,
    "location_latitude": 49.91164829067904,
    "issuedUtc": "2024-07-11T21:00:00",
    "hourly_forecast_group": [
        {
            "TimestampUtc": "2024-07-11T13:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T13:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-12.8",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T14:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T14:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-13.2",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T15:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T15:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-13.1",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T16:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T16:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-12.5",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T17:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T17:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-12.3",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T18:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T18:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-10.8",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T19:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T19:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-8.8",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T20:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T20:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-5.2",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T21:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T21:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-4.3",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T22:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T22:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-4.5",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-11T23:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-11T23:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-5.1",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T00:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T00:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-4.2",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T01:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T01:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-5.7",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T02:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T02:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-6.4",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T03:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T03:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-6.8",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T04:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T04:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-7",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T05:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T05:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-7.1",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T06:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T06:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-7.2",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T07:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T07:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-7.5",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T08:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T08:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-7.7",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T09:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T09:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-7.9",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T10:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T10:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-8",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T11:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T11:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-7.9",
            "Unit": "°C"
        },
        {
            "TimestampUtc": "2024-07-12T12:00:00.000Z",
            "ObservationTypeName": "surfaceCondition",
            "Value": "DRY",
            "Unit": ""
        },
        {
            "TimestampUtc": "2024-07-12T12:00:00.000Z",
            "ObservationTypeName": "surfaceTemp",
            "Value": "-7.9",
            "Unit": "°C"
        }
    ]
}


class Command(BaseCommand):
    def handle(self, *args, **options):
        populate_local_weather_from_data(test_feed)
