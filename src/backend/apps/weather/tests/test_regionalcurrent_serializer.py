from rest_framework import status
from rest_framework.test import APITestCase
from apps.weather.models import RegionalCurrent
from apps.weather.serializers import RegionalCurrentSerializer

class RegionalCurrentAPITestCase(APITestCase):
    def setUp(self):
        self.regional_current_data = {
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
            'condition': 'Clear', 
            'temperature_units': '°C', 
            'temperature_value': '-25.8', 
            'visibility_units': 'km', 
            'visibility_value': '16.1', 
            'wind_speed_units': 'km/h', 
            'wind_speed_value': 4, 
            'wind_gust_units': 'km/h', 
            'wind_gust_value': None, 
            'wind_direction': 'NNE'
        }
        self.regional_current = RegionalCurrent.objects.create(**self.regional_current_data)
        self.url = 'http://localhost:8000/api/weather/regionalcurrent/s0000341'

    def test_serialized_data(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_data = RegionalCurrentSerializer(instance=self.regional_current).data
        self.assertEqual(response.data.get('id'), expected_data.get('id'))
        self.assertEqual(response.data.get('location_code'), expected_data.get('location_code'))
        self.assertEqual(response.data.get('location_latitude'), expected_data.get('location_latitude'))
        self.assertEqual(response.data.get('location_longitude'), expected_data.get('location_longitude'))
