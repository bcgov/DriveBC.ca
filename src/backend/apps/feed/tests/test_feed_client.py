import logging
from unittest.mock import MagicMock, patch
import pytest
from django.core.cache import cache
from httpx import HTTPStatusError
from apps.feed.client import FeedClient, WEBCAM, OPEN511
from apps.feed.constants import REST_STOP
from apps.feed.serializers import WebcamAPISerializer, EventAPISerializer
from apps.shared.tests import BaseTest
from django.conf import settings

logging.getLogger().setLevel(logging.CRITICAL)


def create_mock_response(status_code=200, json_data=None):
    """Helper to create a mock HTTP response."""
    mock_response = MagicMock()
    mock_response.status_code = status_code
    mock_response.json.return_value = json_data or {}
    return mock_response


class TestFeedClientHelperMethods(BaseTest):
    """Test helper methods in FeedClient."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    def test_get_endpoint(self):
        endpoint = self.client._get_endpoint(WEBCAM, 'webcams/123')
        self.assertIn('webcams/123', endpoint)

    def test_get_auth_headers_with_key(self):
        self.client.resource_map[WEBCAM]['auth_key'] = 'test_api_key'
        headers = self.client._get_auth_headers(WEBCAM)
        self.assertEqual(headers, {'apiKey': 'test_api_key'})

    def test_get_auth_headers_without_key(self):
        headers = self.client._get_auth_headers(WEBCAM)
        self.assertEqual(headers, {})

    def test_get_response_data_or_raise_success(self):
        mock_response = create_mock_response(200, {'key': 'value'})
        result = self.client._get_response_data_or_raise(mock_response)
        self.assertEqual(result, {'key': 'value'})

    def test_get_response_data_or_raise_bad_request(self):
        mock_response = create_mock_response(400, {'error': 'bad request'})
        result = self.client._get_response_data_or_raise(mock_response)
        self.assertEqual(result, {'error': 'bad request'})

    def test_get_response_data_or_raise_unauthorized(self):
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.raise_for_status.side_effect = HTTPStatusError(
            'Unauthorized', request=MagicMock(), response=mock_response
        )
        with pytest.raises(HTTPStatusError):
            self.client._get_response_data_or_raise(mock_response)

    def test_get_response_data_or_raise_server_error(self):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = HTTPStatusError(
            'Server Error', request=MagicMock(), response=mock_response
        )
        with pytest.raises(HTTPStatusError):
            self.client._get_response_data_or_raise(mock_response)


class TestFeedClientWeatherToken(BaseTest):
    """Test weather token authentication methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.requests.post')
    def test_get_new_weather_access_token(self, mock_post):
        mock_response = MagicMock()
        mock_response.json.return_value = {'access_token': 'test_token_123'}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        token = self.client.get_new_weather_access_token()
        self.assertEqual(token, 'test_token_123')

    @patch('apps.feed.client.requests.post')
    def test_get_new_weather_access_token_raises(self, mock_post):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = HTTPStatusError(
            'Error', request=MagicMock(), response=mock_response
        )
        mock_post.return_value = mock_response
        with pytest.raises(HTTPStatusError):
            self.client.get_new_weather_access_token()

    @patch('apps.feed.client.requests.get')
    @patch.object(FeedClient, 'get_new_weather_access_token')
    def test_make_weather_request_with_cached_token(self, mock_get_token, mock_get):
        cache.set('weather_access_token', 'cached_token')
        mock_response = create_mock_response(200)
        mock_get.return_value = mock_response

        result = self.client.make_weather_request(settings.DRIVEBC_WEATHER_CURRENT_API_BASE_URL)
        self.assertEqual(result, mock_response)
        mock_get_token.assert_not_called()

    @patch('apps.feed.client.requests.get')
    @patch.object(FeedClient, 'get_new_weather_access_token')
    def test_make_weather_request_fetches_new_token(self, mock_get_token, mock_get):
        mock_response = create_mock_response(200)
        mock_get.return_value = mock_response
        mock_get_token.return_value = 'new_token'

        result = self.client.make_weather_request(settings.DRIVEBC_WEATHER_CURRENT_API_BASE_URL, mock_token=None)
        self.assertEqual(result, mock_response)

    @patch('apps.feed.client.requests.get')
    @patch.object(FeedClient, 'get_new_weather_access_token')
    def test_make_weather_request_token_expiry_retry(self, mock_get_token, mock_get):
        expired_response = MagicMock()
        expired_response.status_code = 401
        expired_response.text = 'Token expired'
        new_response = create_mock_response(200)
        mock_get.side_effect = [expired_response, new_response]
        mock_get_token.return_value = 'new_token'

        result = self.client.make_weather_request(settings.DRIVEBC_WEATHER_CURRENT_API_BASE_URL)
        self.assertEqual(result, new_response)
        self.assertEqual(mock_get.call_count, 2)

    @patch('apps.feed.client.requests.get')
    @patch.object(FeedClient, 'get_new_weather_access_token')
    def test_make_weather_request_with_explicit_token(self, mock_get_token, mock_get):
        mock_response = create_mock_response(200)
        mock_get.return_value = mock_response

        result = self.client.make_weather_request(settings.DRIVEBC_WEATHER_CURRENT_API_BASE_URL, mock_token='explicit_token')
        self.assertEqual(result, mock_response)
        mock_get_token.assert_not_called()


class TestFeedClientGetSingleFeed(BaseTest):
    """Test get_single_feed method."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()
        self.valid_webcam_data = {
            'id': 123,
            'camName': 'Test Cam',
            'caption': 'Test caption',
            'dbcMark': 'test',
            'credit': 'Test credit',
            'region': {'name': 'Test', 'group': 1},
            'regionGroup': {'highwayGroup': 1, 'highwayCamOrder': 1},
            'highway': {'number': 5, 'locationDescription': 'Test'},
            'location': {'latitude': 49.0, 'longitude': -123.0, 'elevation': 100},
            'orientation': 'N',
            'isOn': True,
            'shouldAppear': True,
            'isNew': False,
            'isOnDemand': False,
            'message': {'short': '', 'long': ''},
            'imageStats': {
                'markedStale': False,
                'markedDelayed': False,
                'lastAttempt': {'time': '2023-06-09 16:58:04', 'seconds': 360},
                'lastModified': {'time': '2023-06-09 16:58:04', 'seconds': 360},
                'updatePeriodMean': 899,
                'updatePeriodStdDev': 12
            }
        }

    @patch('apps.feed.client.httpx.get')
    @patch('apps.feed.serializers.WebcamFeedSerializer')
    def test_get_single_feed(self, mock_serializer_cls, mock_get):
        mock_response = create_mock_response(200, self.valid_webcam_data)
        mock_get.return_value = mock_response

        mock_serializer = MagicMock()
        mock_serializer.is_valid = MagicMock(return_value=True)
        mock_serializer.validated_data = {'id': 123}
        mock_serializer_cls.return_value = mock_serializer

        from apps.feed.serializers import WebcamFeedSerializer
        result = self.client.get_single_feed('123', WEBCAM, 'webcams/', WebcamFeedSerializer)
        self.assertIsNotNone(result)

    @patch('apps.feed.client.httpx.get')
    @patch('apps.feed.serializers.WebcamFeedSerializer')
    def test_get_single_feed_returns_list(self, mock_serializer_cls, mock_get):
        mock_response = create_mock_response(200, [self.valid_webcam_data])
        mock_get.return_value = mock_response

        mock_serializer = MagicMock()
        mock_serializer.is_valid = MagicMock(return_value=True)
        mock_serializer.validated_data = {'id': 123}
        mock_serializer_cls.return_value = mock_serializer

        from apps.feed.serializers import WebcamFeedSerializer
        result = self.client.get_single_feed('123', WEBCAM, 'webcams/', WebcamFeedSerializer)
        self.assertIsNotNone(result)

    @patch('apps.feed.client.httpx.get')
    @patch('apps.feed.client.WebcamFeedSerializer')
    def test_get_single_feed_as_serializer(self, mock_serializer_cls, mock_get):
        mock_response = create_mock_response(200, {'id': '123', 'name': 'Test'})
        mock_get.return_value = mock_response

        mock_serializer = MagicMock()
        mock_serializer_cls.return_value = mock_serializer
        mock_serializer.is_valid = MagicMock()
        mock_serializer.save = MagicMock()

        result = self.client.get_single_feed('123', WEBCAM, 'webcams/', mock_serializer_cls, as_serializer=True)
        self.assertEqual(result, mock_serializer)


class TestFeedClientGetListFeed(BaseTest):
    """Test get_list_feed method."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.httpx.get')
    def test_get_list_feed_success(self, mock_get):
        mock_response = create_mock_response(200, {'webcams': []})
        mock_get.return_value = mock_response

        result = self.client.get_list_feed(WEBCAM, 'webcams', WebcamAPISerializer)
        self.assertIn('webcams', result)

    @patch('apps.feed.client.httpx.get')
    def test_get_list_feed_with_params(self, mock_get):
        mock_response = create_mock_response(200, {'events': []})
        mock_get.return_value = mock_response

        result = self.client.get_list_feed(OPEN511, 'events', EventAPISerializer, {'limit': 500})
        self.assertIn('events', result)


class TestFeedClientWebcam(BaseTest):
    """Test webcam feed methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.httpx.get')
    def test_get_webcam_list(self, mock_get):
        mock_response = create_mock_response(200, {'webcams': []})
        mock_get.return_value = mock_response

        result = self.client.get_webcam_list()
        self.assertIn('webcams', result)

    @patch('apps.feed.client.FeedClient.get_single_feed')
    def test_get_webcam(self, mock_get_single):
        mock_get_single.return_value = {'id': 123, 'name': 'Test'}

        class MockWebcam:
            id = 123

        result = self.client.get_webcam(MockWebcam())
        self.assertEqual(result, {'id': 123, 'name': 'Test'})


class TestFeedClientEvent(BaseTest):
    """Test event feed methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.httpx.get')
    def test_get_event_list(self, mock_get):
        mock_response = create_mock_response(200, {'events': []})
        mock_get.return_value = mock_response

        result = self.client.get_event_list()
        self.assertIsNotNone(result)

    @patch('apps.feed.client.FeedClient.get_single_feed')
    def test_get_event(self, mock_get_single):
        mock_get_single.return_value = {'id': 'event1', 'status': 'closed'}

        class MockEvent:
            id = 'event1'

        result = self.client.get_event(MockEvent())
        self.assertEqual(result, {'id': 'event1', 'status': 'closed'})

    @patch('apps.feed.client.FeedClient.get_single_feed')
    @patch('apps.feed.client.FeedClient.get_list_feed')
    def test_get_dit_event_dict(self, mock_get_list, mock_get_single):
        from apps.feed.client import DIT
        from apps.feed.serializers import CarsClosureSerializer

        mock_get_list.return_value = [
            {'id': 'event1', 'status': 'closed'},
            {'id': 'DBCCNUP001', 'status': 'active'}
        ]

        mock_serializer = MagicMock()
        mock_serializer.validated_data = {'id': 'DBCCNUP001'}
        mock_get_single.return_value = mock_serializer

        closures, chain_ups = self.client.get_dit_event_dict()

        self.assertEqual(len(closures), 2)
        self.assertIn('event1', closures)
        self.assertIn('DBCCNUP001', closures)
        self.assertEqual(len(chain_ups), 1)


class TestFeedClientGetListFeedWithErrors(BaseTest):
    """Test get_list_feed with error handling."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.httpx.get')
    def test_get_list_feed_empty_response(self, mock_get):
        from apps.feed.serializers import WebcamAPISerializer

        mock_response = create_mock_response(200, {'webcams': []})
        mock_get.return_value = mock_response

        result = self.client.get_list_feed(WEBCAM, 'webcams', WebcamAPISerializer)
        self.assertIn('webcams', result)


class TestFeedClientFerry(BaseTest):
    """Test ferry feed methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.httpx.get')
    def test_get_ferries_list(self, mock_get):
        mock_response = create_mock_response(200, {'features': []})
        mock_get.return_value = mock_response

        result = self.client.get_ferries_list()
        self.assertIsNotNone(result)


class TestFeedClientRestStop(BaseTest):
    """Test rest stop feed methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.requests.get')
    def test_get_rest_stop_list_feed(self, mock_get):
        mock_response = create_mock_response(200, {
            'features': [{'id': '1', 'geometry': {}, 'properties': {}, 'bbox': []}]
        })
        mock_get.return_value = mock_response

        from apps.feed.serializers import RestStopSerializer
        result = self.client.get_rest_stop_list_feed(REST_STOP, 'reststop', RestStopSerializer)
        self.assertIsNotNone(result)

    @patch('apps.feed.client.FeedClient.get_rest_stop_list_feed')
    def test_get_rest_stop_list(self, mock_get_list_feed):
        mock_get_list_feed.return_value = [{'id': '1'}]

        result = self.client.get_rest_stop_list()
        self.assertEqual(result, [{'id': '1'}])


class TestFeedClientDistrict(BaseTest):
    """Test district feed methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.httpx.get')
    def test_get_district_list(self, mock_get):
        mock_response = create_mock_response(200, {'features': []})
        mock_get.return_value = mock_response

        result = self.client.get_district_list()
        self.assertIsNotNone(result)


class TestFeedClientWildfire(BaseTest):
    """Test wildfire feed methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.httpx.get')
    def test_get_wildfire_area_list(self, mock_get):
        mock_response = create_mock_response(200, {'features': []})
        mock_get.return_value = mock_response

        result = self.client.get_wildfire_area_list()
        self.assertIsNotNone(result)

    @patch('apps.feed.client.httpx.get')
    def test_get_wildfire_location_list(self, mock_get):
        mock_response = create_mock_response(200, {'features': []})
        mock_get.return_value = mock_response

        result = self.client.get_wildfire_location_list()
        self.assertIsNotNone(result)


class TestFeedClientDMS(BaseTest):
    """Test DMS feed methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.httpx.get')
    def test_get_dms_list(self, mock_get):
        mock_response = create_mock_response(200, {'features': []})
        mock_get.return_value = mock_response

        result = self.client.get_dms_list()
        self.assertIsNotNone(result)

    @patch('apps.feed.client.httpx.get')
    def test_get_dms_list_http_error(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_request = MagicMock()
        mock_request.url = settings.DRIVEBC_WEATHER_CURRENT_API_BASE_URL
        mock_request.method = 'GET'
        mock_request.headers = {}
        mock_response.raise_for_status.side_effect = HTTPStatusError(
            'Server Error', request=mock_request, response=mock_response
        )
        mock_get.return_value = mock_response

        from apps.feed.serializers import DmsAPISerializer
        with pytest.raises(HTTPStatusError):
            self.client.get_dms_list()


class TestFeedClientHighElevation(BaseTest):
    """Test high elevation forecast methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()
        self.valid_area_response = create_mock_response(200, [
            {'AreaType': 'ECHIGHELEVN', 'AreaCode': 'ABC', 'AreaName': 'Test Area'}
        ])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_empty(self, mock_weather_request):
        mock_response = create_mock_response(200, [])
        mock_weather_request.return_value = mock_response

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(result, [])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_with_data(self, mock_weather_request):
        forecast_response = create_mock_response(200, {
            'Location': {'Name': {'Latitude': '50N', 'Longitude': '120W'}},
            'ForecastIssuedUtc': '2024-01-01T12:00:00',
            'ForecastGroup': {
                'Forecasts': [
                    {'Period': {'TextForecastName': 'Today'}, 'TextSummary': 'Sunny', 'AbbreviatedForecast': {'IconCode': {'Code': '00'}}}
                ]
            }
        })
        mock_weather_request.side_effect = [self.valid_area_response, forecast_response]

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['code'], 'ABC')

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_warnings(self, mock_weather_request):
        forecast_response = create_mock_response(200, {
            'Location': {'Name': {'Latitude': '50N', 'Longitude': '120W'}},
            'ForecastIssuedUtc': '2024-01-01T12:00:00',
            'Warnings': {'Events': [{'Type': 'warning'}]},
            'ForecastGroup': {'Forecasts': []}
        })
        mock_weather_request.side_effect = [self.valid_area_response, forecast_response]

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(len(result), 1)
        self.assertIsNotNone(result[0]['warnings'])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_warnings_ended(self, mock_weather_request):
        forecast_response = create_mock_response(200, {
            'Location': {'Name': {'Latitude': '50N', 'Longitude': '120W'}},
            'ForecastIssuedUtc': '2024-01-01T12:00:00',
            'Warnings': {'Events': [{'Type': 'ended'}]},
            'ForecastGroup': {'Forecasts': []}
        })
        mock_weather_request.side_effect = [self.valid_area_response, forecast_response]

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(len(result), 1)
        self.assertIsNone(result[0]['warnings'])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_204_no_content(self, mock_weather_request):
        forecast_response = MagicMock()
        forecast_response.status_code = 204
        mock_weather_request.side_effect = [self.valid_area_response, forecast_response]

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(len(result), 0)

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_invalid_issued_time(self, mock_weather_request):
        forecast_response = create_mock_response(200, {
            'Location': {'Name': {'Latitude': '50N', 'Longitude': '120W'}},
            'ForecastIssuedUtc': 'invalid-date',
            'ForecastGroup': {'Forecasts': []}
        })
        mock_weather_request.side_effect = [self.valid_area_response, forecast_response]

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(len(result), 1)
        self.assertIsNone(result[0]['issued_utc'])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_skips_non_echighelevn(self, mock_weather_request):
        area_response = create_mock_response(200, [
            {'AreaType': 'OTHER', 'AreaCode': 'ABC', 'AreaName': 'Other Area'},
            {'AreaType': 'ECHIGHELEVN', 'AreaCode': 'DEF', 'AreaName': 'High Elev'}
        ])
        forecast_response = create_mock_response(200, {
            'Location': {'Name': {'Latitude': '50N', 'Longitude': '120W'}},
            'ForecastIssuedUtc': '2026-01-01T12:00:00',
            'ForecastGroup': {'Forecasts': []}
        })
        mock_weather_request.side_effect = [area_response, forecast_response]

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['code'], 'DEF')

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_request_exception(self, mock_weather_request):
        import requests
        area_response = create_mock_response(200, [
            {'AreaType': 'ECHIGHELEVN', 'AreaCode': 'ABC', 'AreaName': 'Test Area'}
        ])
        mock_weather_request.side_effect = [area_response, requests.RequestException("API Error")]

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(result, [])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_outer_exception(self, mock_weather_request):
        import requests
        mock_weather_request.side_effect = requests.RequestException("Connection Error")

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(result.status_code, 500)

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_high_elevation_forecast_list_valid_issued_date(self, mock_weather_request):
        area_response = create_mock_response(200, [
            {'AreaType': 'ECHIGHELEVN', 'AreaCode': 'ABC', 'AreaName': 'Test Area'}
        ])
        forecast_response = create_mock_response(200, {
            'Location': {'Name': {'Latitude': '50N', 'Longitude': '120W'}},
            'ForecastIssuedUtc': '2024-01-15T10:00:00',
            'ForecastGroup': {'Forecasts': []}
        })
        mock_weather_request.side_effect = [area_response, forecast_response]

        result = self.client.get_high_elevation_forecast_list()
        self.assertEqual(len(result), 1)
        self.assertIsNotNone(result[0].get('issued_utc'))


class TestFeedClientCurrentWeather(BaseTest):
    """Test current weather feed methods."""

    def setUp(self):
        super().setUp()
        self.client = FeedClient()

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_current_weather_list(self, mock_weather_request):
        stations_response = create_mock_response(200, [{'WeatherStationNumber': '123'}])
        forecast_response = create_mock_response(200, {
            'Forecasts': [{'Period': 'Today', 'Text': 'Sunny. High: 20.', 'IconCode': {'Code': '00'}}]
        })
        current_response = create_mock_response(200, {
            'WeatherStation': {
                'WeatherStationName': 'Test Station',
                'Elevation': 100,
                'LocationDescription': 'Test',
                'Longitude': -123.0,
                'Latitude': 49.0
            },
            'Datasets': [{'DataSetName': 'air_temp', 'DisplayName': 'Air Temp', 'Value': '20', 'Unit': 'C'}]
        })
        mock_weather_request.side_effect = [stations_response, forecast_response, current_response]

        result = self.client.get_current_weather_list('test_token')
        self.assertIsNotNone(result)

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_current_weather_list_empty_stations(self, mock_weather_request):
        stations_response = create_mock_response(200, [])
        mock_weather_request.return_value = stations_response

        result = self.client.get_current_weather_list('test_token')
        self.assertEqual(result, [])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_current_weather_list_stations_error(self, mock_weather_request):
        stations_response = create_mock_response(500, {})
        mock_weather_request.return_value = stations_response

        result = self.client.get_current_weather_list('test_token')
        self.assertEqual(result, [])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_current_weather_list_with_vms_station(self, mock_weather_request):
        stations_response = create_mock_response(200, [{'WeatherStationNumber': 'VMS001'}])
        forecast_response = create_mock_response(200, {'Forecasts': []})
        current_response = create_mock_response(200, {
            'WeatherStation': {
                'WeatherStationName': 'VMS Station',
                'Elevation': 100,
                'LocationDescription': 'Test',
                'Longitude': -123.0,
                'Latitude': 49.0
            },
            'Datasets': [{'DataSetName': 'air_temp', 'DisplayName': 'Air Temp', 'Value': '20', 'Unit': 'C'}]
        })
        mock_weather_request.side_effect = [stations_response, forecast_response, current_response]

        from apps.feed.serializers import CurrentWeatherSerializer
        result = self.client.get_current_weather_list_feed(CurrentWeatherSerializer, 'test_token')
        self.assertEqual(result, [])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_current_weather_list_no_datasets(self, mock_weather_request):
        stations_response = create_mock_response(200, [{'WeatherStationNumber': '123'}])
        forecast_response = create_mock_response(200, {'Forecasts': []})
        current_response = create_mock_response(200, {
            'WeatherStation': {
                'WeatherStationName': 'Test Station',
                'Elevation': 100,
                'LocationDescription': 'Test',
                'Longitude': -123.0,
                'Latitude': 49.0
            },
            'Datasets': None
        })
        mock_weather_request.side_effect = [stations_response, forecast_response, current_response]

        from apps.feed.serializers import CurrentWeatherSerializer
        result = self.client.get_current_weather_list_feed(CurrentWeatherSerializer, 'test_token')
        self.assertEqual(result, [])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_current_weather_list_forecast_error(self, mock_weather_request):
        stations_response = create_mock_response(200, [{'WeatherStationNumber': '123'}])
        forecast_response = create_mock_response(500, {})
        mock_weather_request.side_effect = [stations_response, forecast_response]

        from apps.feed.serializers import CurrentWeatherSerializer
        result = self.client.get_current_weather_list_feed(CurrentWeatherSerializer, 'test_token')
        self.assertEqual(result, [])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_current_weather_list_general_data_error(self, mock_weather_request):
        stations_response = create_mock_response(200, [{'WeatherStationNumber': '123'}])
        forecast_response = create_mock_response(200, {'Forecasts': []})
        general_response = create_mock_response(500, {})
        mock_weather_request.side_effect = [stations_response, forecast_response, general_response]

        from apps.feed.serializers import CurrentWeatherSerializer
        result = self.client.get_current_weather_list_feed(CurrentWeatherSerializer, 'test_token')
        self.assertEqual(result, [])

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_current_weather_list_with_collection_utc(self, mock_weather_request):
        stations_response = create_mock_response(200, [{'WeatherStationNumber': '123'}])
        forecast_response = create_mock_response(200, {'Forecasts': []})
        current_response = create_mock_response(200, {
            'WeatherStation': {
                'WeatherStationName': 'Test Station',
                'Elevation': 100,
                'LocationDescription': 'Test',
                'Longitude': -123.0,
                'Latitude': 49.0
            },
            'Datasets': [{'DataSetName': 'air_temp', 'CollectionUtc': '2024-01-01T12:00:00', 'Value': '20', 'Unit': 'C'}]
        })
        mock_weather_request.side_effect = [stations_response, forecast_response, current_response]

        from apps.feed.serializers import CurrentWeatherSerializer
        result = self.client.get_current_weather_list_feed(CurrentWeatherSerializer, 'test_token')
        self.assertEqual(len(result), 1)

    @patch('apps.feed.client.FeedClient.make_weather_request')
    def test_get_current_weather_list_collection_utc_parse_error(self, mock_weather_request):
        stations_response = create_mock_response(200, [{'WeatherStationNumber': '123'}])
        forecast_response = create_mock_response(200, {'Forecasts': []})
        current_response = create_mock_response(200, {
            'WeatherStation': {
                'WeatherStationName': 'Test Station',
                'Elevation': 100,
                'LocationDescription': 'Test',
                'Longitude': -123.0,
                'Latitude': 49.0
            },
            'Datasets': [{'DataSetName': 'air_temp', 'CollectionUtc': 'invalid-date', 'Value': '20', 'Unit': 'C'}]
        })
        mock_weather_request.side_effect = [stations_response, forecast_response, current_response]

        from apps.feed.serializers import CurrentWeatherSerializer
        result = self.client.get_current_weather_list_feed(CurrentWeatherSerializer, 'test_token')
        self.assertEqual(len(result), 0)
