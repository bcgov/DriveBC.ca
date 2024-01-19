from rest_framework import status
from rest_framework.test import APITestCase
from apps.weather.models import RegionalForecast
from apps.weather.serializers import RegionalForecastSerializer

class RegionalForecastAPITestCase(APITestCase):
    def setUp(self):
        self.regional_forecast_data = {
            'id': 2, 
            'created_at': '2024-01-19T07:42:33.197923-08:00', 
            'modified_at': '2024-01-19T07:42:33.197923-08:00', 
            'location_code': 's0000341', 
            'location_latitude': '58.66N', 
            'location_longitude': '124.64W', 
            'location_name': 'Tetsa River (Provincial Park)"', 
            'region': 'Muncho Lake Park - Stone Mountain Park', 
            'observation_name': 'observation', 
            'observation_zone': 'UTC', 
            'observation_utc_offset': 0, 
            'observation_text_summary': 'Friday January 19, 2024 at 15:00 UTC', 
            "forecast_group": {
                "ForecastIssueUtc": None,
                "RegionalNormals": None,
                "Forecasts": [
                    {
                        "Period": {
                        "TextForecastName": "Today",
                        "Value": "Friday"
                    },
                "TextSummary": "Mainly sunny. Wind up to 15 km/h. High minus 25. Wind chill minus 41 this morning. Frostbite in minutes.",
                "CloudPrecip": {
                    "TextSummary": "Mainly sunny."
                },
                "AbbreviatedForecast": {
                    "IconCode": {
                        "Format": "gif",
                        "Code": "01"
                    },
                    "Pop": None,
                    "TextSummary": "Mainly sunny"
                },
                "Temperatures": {
                    "TextSummary": "High minus 25.",
                    "Temperature": {
                        "Class": "high",
                        "Period": None,
                        "Units": "°C",
                        "Year": None,
                        "Value": "-25"
                    }
                },
                "Winds": {
                    "TextSummary": "Wind up to 15 km/h.",
                    "WindList": [
                        {
                            "Speed": {
                                "Units": "km/h",
                                "Value": "05"
                            },
                            "Gust": {
                                "Units": "km/h",
                                "Value": "00"
                            },
                            "Direction": {
                                "WindDirFull": None,
                                "Value": "VR"
                            },
                            "Bearing": {
                                "Units": "degrees",
                                "Value": "99"
                            },
                            "Index": "1",
                            "Rank": "major"
                        },
                        {
                            "Speed": {
                                "Units": "km/h",
                                "Value": "00"
                            },
                            "Gust": None,
                            "Direction": None,
                            "Bearing": None,
                            "Index": "2",
                            "Rank": "major"
                        }
                    ]
                },
                "Precipitation": {
                    "TextSummary": None,
                    "PrecipType": {
                        "Start": None,
                        "End": None,
                        "Value": None
                    },
                    "Accumulations": None
                },
                "WindChill": {
                    "TextSummary": "Wind chill minus 41 this morning. Frostbite in minutes.",
                    "Calculated": {
                        "Class": "morning",
                        "Value": "-41"
                    },
                    "Value": None,
                    "Units": None
                },
                "RelativeHumidity": {
                    "Units": "%",
                    "Value": "80"
                },
                "UV": {
                    "Category": None,
                    "Index": None,
                    "TextSummary": None
                },
                "Frost": None,
                "SnowLevel": None,
                "Comfort": None,
                "Visibility": {
                    "OtherVisibility": {
                        "Cause": None,
                        "TextSummary": None
                    },
                    "WindVisibility": {
                        "Cause": None,
                        "TextSummary": None
                    }
                }
            },
            {
                "Period": {
                    "TextForecastName": "Tonight",
                    "Value": "Friday night"
                },
                "TextSummary": "A few clouds. Wind up to 15 km/h. Low minus 39. Wind chill minus 33 this evening and minus 46 overnight. Frostbite in minutes.",
                "CloudPrecip": {
                    "TextSummary": "A few clouds."
                },
                "AbbreviatedForecast": {
                    "IconCode": {
                        "Format": "gif",
                        "Code": "31"
                    },
                    "Pop": None,
                    "TextSummary": "A few clouds"
                },
                "Temperatures": {
                    "TextSummary": "Low minus 39.",
                    "Temperature": {
                        "Class": "low",
                        "Period": None,
                        "Units": "°C",
                        "Year": None,
                        "Value": "-39"
                    }
                },
                "Winds": {
                    "TextSummary": "Wind up to 15 km/h.",
                    "WindList": [
                        {
                            "Speed": {
                                "Units": "km/h",
                                "Value": "05"
                            },
                            "Gust": {
                                "Units": "km/h",
                                "Value": "00"
                            },
                            "Direction": {
                                "WindDirFull": None,
                                "Value": "VR"
                            },
                            "Bearing": {
                                "Units": "degrees",
                                "Value": "99"
                            },
                            "Index": "1",
                            "Rank": "major"
                        }
                    ]
                },
                "Precipitation": {
                    "TextSummary": None,
                    "PrecipType": {
                        "Start": None,
                        "End": None,
                        "Value": None
                    },
                    "Accumulations": None
                },
                "WindChill": {
                    "TextSummary": "Wind chill minus 33 this evening and minus 46 overnight. Frostbite in minutes.",
                    "Calculated": {
                        "Class": "evening",
                        "Value": "-33"
                    },
                    "Value": None,
                    "Units": None
                },
                "RelativeHumidity": {
                    "Units": "%",
                    "Value": "100"
                },
                "UV": {
                    "Category": None,
                    "Index": None,
                    "TextSummary": None
                },
                "Frost": None,
                "SnowLevel": None,
                "Comfort": None,
                "Visibility": {
                    "OtherVisibility": {
                        "Cause": None,
                        "TextSummary": None
                    },
                    "WindVisibility": {
                        "Cause": None,
                        "TextSummary": None
                    }
                }
            }
        ]
    },
            "hourly_forecast_group": {
                "ForecastIssueUtc": None,
                "HourlyForecasts": [
                    {
                        "HourlyTimeStampUtc": "2024-01-19T17:00:00.000Z",
                        "Condition": "Mainly sunny",
                        "Icon": {
                            "Format": "png",
                            "Code": "01"
                        },
                        "Temperature": {
                            "Class": None,
                            "Period": None,
                            "Units": "°C",
                            "Year": None,
                            "Value": "-32"
                        },
                        "Lop": {
                            "Value": "20",
                            "Category": "Low",
                            "Units": "%"
                        },
                        "WindChill": None,
                        "Wind": {
                            "Speed": {
                                "Units": "km/h",
                                "Value": "Calm"
                            },
                            "Gust": None,
                            "Direction": None,
                            "Bearing": None,
                            "Index": None,
                            "Rank": None
                        }
                    },
                    {
                        "HourlyTimeStampUtc": "2024-01-19T18:00:00.000Z",
                        "Condition": "Mainly sunny",
                        "Icon": {
                            "Format": "png",
                            "Code": "01"
                        },
                        "Temperature": {
                            "Class": None,
                            "Period": None,
                            "Units": "°C",
                            "Year": None,
                            "Value": "-30"
                        },
                        "Lop": {
                            "Value": "20",
                            "Category": "Low",
                            "Units": "%"
                        },
                        "WindChill": None,
                        "Wind": {
                            "Speed": {
                                "Units": "km/h",
                                "Value": "Calm"
                            },
                            "Gust": None,
                            "Direction": None,
                            "Bearing": None,
                            "Index": None,
                            "Rank": None
                        }
                    }
                ]
            }

        }
   
    

        self.regional_forecast = RegionalForecast.objects.create(**self.regional_forecast_data)
        self.url = 'http://localhost:8000/api/weather/regionalforecast/s0000341'

    def test_serialized_data(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_data = RegionalForecastSerializer(instance=self.regional_forecast).data
        self.assertEqual(response.data.get('id'), expected_data.get('id'))
        self.assertEqual(response.data.get('location_code'), expected_data.get('location_code'))
        self.assertEqual(response.data.get('location_latitude'), expected_data.get('location_latitude'))
        self.assertEqual(response.data.get('location_longitude'), expected_data.get('location_longitude'))
