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
    Tests all API routes with three DMS objects covering different scenarios.
    """

    def setUp(self):
        """Set up test data with three diverse DMS objects."""
        cache.clear()

        # DMS Object 1: Standard ADDCO sign with full message
        self.dms1 = Dms.objects.create(
            id="ATIS-SUR-17W-2",
            name="DMS10",
            name_override="",
            category="ADDCO 2x20 LM-2 FRATIS",
            description="Hwy 17 WB at 136 St.",
            roadway_name="Highway 17",
            roadway_direction="Westbound",
            static_text="",
            message_text="[pt30o0][fo3][jl2]PATTULLO BR[jl4]<5 MIN[nl][jl2]"
                         "PORT MANN BR[jl4]<5 MIN[np][pt30o0][fo3][jl2]"
                         "ALEX FRASER BR[jl4]<5 MIN[nl][jl2]"
                         "MASSEY TUNNEL[jl4]<5 MIN",
            status="OK",
            location=Point(-122.848, 49.2133),
            updated_datetime_utc=datetime(2025, 12, 8, 13, 2, 16, tzinfo=timezone('UTC')),
            message_expiry_datetime_utc=None,
            cache_datetime_utc=datetime(2026, 2, 2, 17, 30, 1, tzinfo=timezone('UTC')),
            is_on=True
        )

        # DMS Object 2: Another ADDCO sign with different message order
        self.dms2 = Dms.objects.create(
            id="ATIS-SUR-1W-1",
            name="DMS03",
            name_override="",
            category="ADDCO 2x20 LM-2 FRATIS",
            description="Hwy 1 WB at 187 St.",
            roadway_name="Highway 1",
            roadway_direction="Westbound",
            static_text="",
            message_text="[pt30o0][fo3][jl2]PORT MANN BR[jl4]<5 MIN[nl][jl2]"
                         "PATTULLO BR[jl4]<5 MIN[np][pt30o0][fo3][jl2]"
                         "ALEX FRASER BR[jl4]6 MIN[nl][jl2]MASSEY TUNNEL[jl4]<5 MIN",
            status="OK",
            location=Point(-122.706, 49.1741),
            updated_datetime_utc=datetime(2026, 2, 2, 17, 19, 6, tzinfo=timezone('UTC')),
            message_expiry_datetime_utc=None,
            cache_datetime_utc=datetime(2026, 2, 2, 17, 30, 1, tzinfo=timezone('UTC')),
            is_on=True
        )

        # DMS Object 3: BosDevice with empty message and static text
        self.dms3 = Dms.objects.create(
            id="Clapperton Chain Up",
            name="Clapperton Chain Up",
            name_override="",
            category="BosDevice",
            description="",
            roadway_name="Coquihalla Hwy",
            roadway_direction="Northbound",
            static_text="Chain Up when flashing",
            message_text="",
            status="(ReportedByDevice-Informational) Ok (@ 02/02/2026 9:24:01 AM)",
            location=Point(-120.713, 50.1598),
            updated_datetime_utc=datetime(2026, 2, 2, 17, 24, 1, tzinfo=timezone('UTC')),
            message_expiry_datetime_utc=None,
            cache_datetime_utc=datetime(2026, 2, 2, 17, 30, 1, tzinfo=timezone('UTC')),
            is_on=True
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

        # Verify all three DMS objects are present
        ids = [item['id'] for item in response.data]
        assert "ATIS-SUR-17W-2" in ids
        assert "ATIS-SUR-1W-1" in ids
        assert "Clapperton Chain Up" in ids

    # Test ViewSet Detail Endpoint (/dms/{id}/)
    def test_dms_viewset_detail_endpoint_valid_id(self):
        """Test GET /dms/{id}/ returns specific DMS object."""
        url = reverse('dms-list') + 'ATIS-SUR-17W-2/'
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)
        assert response.data['id'] == "ATIS-SUR-17W-2"
        assert response.data['name'] == "DMS10"
        assert response.data['category'] == "ADDCO 2x20 LM-2 FRATIS"
        assert response.data['roadway_name'] == "Highway 17"
        assert response.data['roadway_direction'] == "Westbound"

    # Test ViewSet Detail Endpoint with invalid ID (/dms/{id}/)
    def test_dms_viewset_detail_endpoint_invalid_id(self):
        """Test GET /dms/{id}/ with non-existent ID returns 404."""
        url = reverse('dms-list') + 'NON-EXISTENT-ID/'
        response = self.client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
