from datetime import datetime

from apps.dms.models import Dms
from django.contrib.gis.geos import Point
from django.core.cache import cache
from django.urls import reverse
from pytz import timezone
from rest_framework import status
from rest_framework.test import APITestCase


class TestDmsAPIEndpoints(APITestCase):
    """
    Comprehensive test suite for DMS API endpoints.
    Uses sign/status payload data shaped like the live DMS feed.
    """

    @staticmethod
    def _parse_utc(value):
        if not value:
            return None
        return datetime.fromisoformat(value.replace('Z', '+00:00'))

    def setUp(self):
        """Set up test data using sign/status payloads similar to the live API."""
        cache.clear()

        sign_1 = {
            'Id': 1,
            'Name': 'INFO-KAM-1W-1',
            'Description': 'WB Hwy 1 West of Aberdeen',
            'Type': 'DMS',
            'Location': {
                'RoadwayName': 'Highway 1 West (East section)',
                'Longitude': -120.38593,
                'Latitude': 50.65537,
            },
        }
        status_1 = {
            'Id': 1,
            'Status': 'Ok',
            'Message': '[pt25o0][jl3][fo1]HIGHWAY 1 OPEN[nl][jl3][fo1]AT BOSTON BAR[np][pt25o0][jl3][fo1]EXPECT DELAYS[nl][jl3][fo1]CHECK DRIVEBC.CA',
            'LastUpdated': '2026-09-04T22:06:30.005Z',
        }

        sign_2 = {
            'Id': 2,
            'Name': 'INFO-COQ-5S-1',
            'Description': 'SB Hwy 5 at Falls Lake',
            'Type': 'DMS',
            'Location': {
                'RoadwayName': 'Highway 5 South',
                'Longitude': -121.05067,
                'Latitude': 49.61203,
            },
        }
        status_2 = {
            'Id': 2,
            'Status': 'Ok',
            'Message': '[jl3][fo4]KNOW BEFORE YOU GO[nl][jl3][fo4]CHECK DRIVEBC.CA',
            'LastUpdated': '2026-09-04T21:44:10.794Z',
        }

        sign_5 = {
            'Id': 5,
            'Name': 'DMS01',
            'Description': 'EB Hwy 1 in Burnaby',
            'Type': 'Travel Time',
            'Location': {
                'RoadwayName': 'Highway 1 East (West section)',
                'Longitude': -122.99575,
                'Latitude': 49.25772,
            },
        }
        status_5 = {
            'Id': 5,
            'Status': 'Device Error',
            'Message': '',
            'LastUpdated': '2026-09-04T22:05:18.916Z',
        }

        direction_map = {'NB': 'Northbound', 'SB': 'Southbound', 'EB': 'Eastbound', 'WB': 'Westbound'}

        self.dms1 = Dms.objects.create(
            id=str(sign_1['Id']),
            name=sign_1['Name'],
            name_override='',
            category=sign_1['Type'],
            description=sign_1['Description'],
            roadway_name=sign_1['Location']['RoadwayName'],
            roadway_direction=direction_map.get(sign_1['Description'][:2].upper(), ''),
            static_text='',
            message_text=status_1['Message'],
            status=status_1['Status'],
            location=Point(sign_1['Location']['Longitude'], sign_1['Location']['Latitude']),
            updated_datetime_utc=self._parse_utc(status_1['LastUpdated']),
            message_expiry_datetime_utc=None,
            cache_datetime_utc=None,
            is_on=True,
        )

        self.dms2 = Dms.objects.create(
            id=str(sign_2['Id']),
            name=sign_2['Name'],
            name_override='',
            category=sign_2['Type'],
            description=sign_2['Description'],
            roadway_name=sign_2['Location']['RoadwayName'],
            roadway_direction=direction_map.get(sign_2['Description'][:2].upper(), ''),
            static_text='',
            message_text=status_2['Message'],
            status=status_2['Status'],
            location=Point(sign_2['Location']['Longitude'], sign_2['Location']['Latitude']),
            updated_datetime_utc=self._parse_utc(status_2['LastUpdated']),
            message_expiry_datetime_utc=None,
            cache_datetime_utc=None,
            is_on=True,
        )

        self.dms3 = Dms.objects.create(
            id=str(sign_5['Id']),
            name=sign_5['Name'],
            name_override='',
            category=sign_5['Type'],
            description=sign_5['Description'],
            roadway_name=sign_5['Location']['RoadwayName'],
            roadway_direction=direction_map.get(sign_5['Description'][:2].upper(), ''),
            static_text='',
            message_text=status_5['Message'],
            status=status_5['Status'],
            location=Point(sign_5['Location']['Longitude'], sign_5['Location']['Latitude']),
            updated_datetime_utc=self._parse_utc(status_5['LastUpdated']),
            message_expiry_datetime_utc=None,
            cache_datetime_utc=None,
            is_on=True,
        )

    def tearDown(self):
        """Clean up cache after each test."""
        cache.clear()

    # Test ViewSet List Endpoint (/dms/ via router)
    def test_dms_viewset_list_endpoint(self):
        """Test GET /dms/ returns list of all DMS objects."""
        url = reverse('dms-list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == 3

        ids = [item['id'] for item in response.data]
        assert '1' in ids
        assert '2' in ids
        assert '5' in ids

    # Test ViewSet Detail Endpoint (/dms/{id}/)
    def test_dms_viewset_detail_endpoint_valid_id(self):
        """Test GET /dms/{id}/ returns specific DMS object."""
        url = reverse('dms-list') + '1/'
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)
        assert response.data['id'] == '1'
        assert response.data['name'] == 'INFO-KAM-1W-1'
        assert response.data['category'] == 'DMS'
        assert response.data['roadway_name'] == 'Highway 1 West (East section)'
        assert response.data['roadway_direction'] == 'Westbound'

    # Test ViewSet Detail Endpoint with invalid ID (/dms/{id}/)
    def test_dms_viewset_detail_endpoint_invalid_id(self):
        """Test GET /dms/{id}/ with non-existent ID returns 404."""
        url = reverse('dms-list') + 'NON-EXISTENT-ID/'
        response = self.client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
