from apps.feed.client import FeedClient
from apps.shared.tests import BaseTest
class TestLocalWeatherFunctions(BaseTest):
    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    # get_local_weather_icon_code tests    
    def test_weather_icon_code(self):
        result = self.client.get_local_weather_icon_code("Thunderstorms", "day")
        self.assertEqual(result, '19')
        result = self.client.get_local_weather_icon_code("Sunny", "day")
        self.assertEqual(result, '00')
        result = self.client.get_local_weather_icon_code("Sunny with cloud", "day")
        self.assertEqual(result, '02')
        result = self.client.get_local_weather_icon_code("Rain", "day")
        self.assertEqual(result, '12')
        result = self.client.get_local_weather_icon_code("Heavy rain", "day")
        self.assertEqual(result, '13')
        result = self.client.get_local_weather_icon_code("Rain with snow", "day")
        self.assertEqual(result, '15')
        result = self.client.get_local_weather_icon_code("Light snow", "day")
        self.assertEqual(result, '16')
        result = self.client.get_local_weather_icon_code("Snow", "day")
        self.assertEqual(result, '17')
        result = self.client.get_local_weather_icon_code("Showers", "day")
        self.assertEqual(result, '12')
        result = self.client.get_local_weather_icon_code("Clearing", "night")
        self.assertEqual(result, '35')
        result = self.client.get_local_weather_icon_code("Clear", "night")
        self.assertEqual(result, '30')
        result = self.client.get_local_weather_icon_code("Increasing cloud", "night")
        self.assertEqual(result, '34')
        result = self.client.get_local_weather_icon_code("Partly cloudy", "day")
        self.assertEqual(result, '03')
        result = self.client.get_local_weather_icon_code("Partly cloudy", "night")
        self.assertEqual(result, '33')
        result = self.client.get_local_weather_icon_code("Overcast", "day")
        self.assertEqual(result, '10')
        result = self.client.get_local_weather_icon_code("Fog", "day")
        self.assertEqual(result, '24')
        result = self.client.get_local_weather_icon_code("Unknown", "day")
        self.assertEqual(result, None)
        result = self.client.get_local_weather_icon_code("", "day")
        self.assertEqual(result, None)
        
    
    # extract_high_value tests
    def test_extract_high_value_normal(self):
        result = self.client.extract_high_value("Cloudy. Rain. High: 4.")
        self.assertEqual(result, 4.0)
        result = self.client.extract_high_value("Cloudy. Rain.")
        self.assertEqual(result, None)
    
    # extract_low_value tests
    def test_extract_low_value_normal(self):
        result = self.client.extract_low_value("Cloudy.  Few snow showers/flurries develop after 1-2am.  1-3 cm road snow accumulations.  Low: -2.")
        self.assertEqual(result, -2.0)
        result = self.client.extract_low_value("Cloudy.  Few snow showers/flurries develop after 1-2am.  1-3 cm road snow accumulations.")
        self.assertEqual(result, None)