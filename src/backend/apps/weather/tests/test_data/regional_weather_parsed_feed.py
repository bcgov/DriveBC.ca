import datetime
import zoneinfo
from collections import OrderedDict

from django.contrib.gis.geos import LineString

# parsed_feed = OrderedDict([
#     ("location_code", "s0000341"),
#     ("location_latitude", "58.66N"),
#     ("location_longitude", "124.64W"),
#     ("location_name", "Victoria"),
#     ("region", "Victoria"),
#     ('observation_name', 'observation'),
#     ('observation_zone', 'UTC'),
#     ('observation_utc_offset', 0),
#     ('observation_text_summary', '2024-01-24:12:00:00'),
#     ("location_longitude", "124.64W"),
#     ("conditions", {
#                 "condition", "clear",
#                 "wind_direction", "N",
#                 "wind_gust_units", "km",
#                 "wind_gust_value", "16.5",
#                 "visibility_units", "km",
#                 "visibility_value", "2.3",
#                 "wind_speed_units", "km",
#                 "wind_speed_value", "45",
#                 "temperature_units", "C",
#                 "temperature_value", "27",
#             },
#     ),
#     ('forecast_group', {}),
#     ('hourly_forecast_group', {}),
    
# ])

json_feed = {
            "location_code": "s0000341", 
            "location_latitude": "58.66N", 
            "location_longitude": "124.64W", 
            "location_name": "Tetsa River (Provincial Park)", 
            "region": "Muncho Lake Park - Stone Mountain Park", 
            "observation_name": 'observation', 
            "observation_zone": 'UTC', 
            "observation_utc_offset": 0, 
            "observation_text_summary": "Friday January 19, 2024 at 15:00 UTC",
            "conditions": {
                "condition": 'clear',
                "wind_direction": 'N',
                "wind_gust_units": 'km',
                "wind_gust_value": '16.5',
                "visibility_units": 'km',
                "visibility_value": '2.3',
                "wind_speed_units": 'km',
                "wind_speed_value": '45',
                "temperature_units": 'C',
                "temperature_value": '27'
            },
            "forecast_group": [
                {
                    "UV": {
                        "Index": None,
                        "Category": None,
                        "TextSummary": None
                    },
                    "Frost": None,
                    "Winds": {
                        "WindList": [
                            {
                                "Gust": None,
                                "Rank": "major",
                                "Index": "1",
                                "Speed": {
                                    "Units": "km/h",
                                    "Value": "00"
                                },
                                "Bearing": None,
                                "Direction": None
                            }
                        ],
                        "TextSummary": None
                    },
                    "Period": {
                        "Value": "Tuesday",
                        "TextForecastName": "Today"
                    },
                    "Comfort": None,
                    "SnowLevel": None,
                    "WindChill": {
                        "Units": None,
                        "Value": None,
                        "Calculated": {
                            "Class": None,
                            "Value": None
                        },
                        "TextSummary": None
                    },
                    "Visibility": {
                        "WindVisibility": {
                            "Cause": None,
                            "TextSummary": None
                        },
                        "OtherVisibility": {
                            "Cause": None,
                            "TextSummary": None
                        }
                    },
                    "CloudPrecip": {
                        "TextSummary": "Flurries."
                    },
                    "TextSummary": "Flurries. High plus 2.",
                    "Temperatures": {
                        "Temperature": {
                            "Year": None,
                            "Class": "high",
                            "Units": "°C",
                            "Value": "2",
                            "Period": None
                        },
                        "TextSummary": "High plus 2."
                    },
                    "Precipitation": {
                        "PrecipType": {
                            "End": "26",
                            "Start": "19",
                            "Value": "snow"
                        },
                        "TextSummary": None,
                        "Accumulations": None
                    },
                    "RelativeHumidity": {
                        "Units": "%",
                        "Value": "80"
                    },
                    "AbbreviatedForecast": {
                        "Pop": None,
                        "IconCode": {
                            "Code": "16",
                            "Format": "gif"
                        },
                        "TextSummary": "A few flurries"
                    }
                }],
            "hourly_forecast_group": [
                {
                    "Lop": {
                        "Units": "%",
                        "Value": "80",
                        "Category": "High"
                    },
                    "Icon": {
                        "Code": "16",
                        "Format": "png"
                    },
                    "Wind": {
                        "Gust": None,
                        "Rank": None,
                        "Index": None,
                        "Speed": {
                            "Units": "km/h",
                            "Value": "Calm"
                        },
                        "Bearing": None,
                        "Direction": None
                    },
                    "Condition": "A few flurries",
                    "WindChill": None,
                    "Temperature": {
                        "Year": None,
                        "Class": None,
                        "Units": "°C",
                        "Value": "1",
                        "Period": None
                    },
                    "HourlyTimeStampUtc": "2024-01-23T22:00:00.000Z"
                },
                {
                    "Lop": {
                        "Units": "%",
                        "Value": "80",
                        "Category": "High"
                    },
                    "Icon": {
                        "Code": "16",
                        "Format": "png"
                    },
                    "Wind": {
                        "Gust": None,
                        "Rank": None,
                        "Index": None,
                        "Speed": {
                            "Units": "km/h",
                            "Value": "Calm"
                        },
                        "Bearing": None,
                        "Direction": None
                    },
                    "Condition": "A few flurries",
                    "WindChill": None,
                    "Temperature": {
                        "Year": None,
                        "Class": None,
                        "Units": "°C",
                        "Value": "2",
                        "Period": None
                    },
                    "HourlyTimeStampUtc": "2024-01-23T23:00:00.000Z"
                }]
            }
