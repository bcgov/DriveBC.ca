from apps.shared.tests import BaseTest
from rest_framework.test import APITestCase
from django.test import Client
import responses

class TestRegionalForecastAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

    def test_regionalforecast_api(self):
        # Mock the SASWx weather API response
        external_api_url = 'https://sawsx-services-dev-api-gov-bc-ca.test.api.gov.bc.ca/api/v1/ec/cityforecast/s0000341'
        external_api_response = {
            "XmlCreationUtc": "Wednesday January 17, 2024 at 19:05 UTC",
            "ForecastIssuedUtc": "2024-01-18T18:00:00",
        }
        responses.add(responses.GET, external_api_url, json=external_api_response, status=200)
        client = Client()
        url = 'http://localhost:8000/api/weather/regionalforecast/s0000341'
        response = client.get(url)
        self.assertEqual(response.status_code, 200)