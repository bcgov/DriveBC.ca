from apps.cms.models import Advisory
from apps.cms.serializers import AdvisorySerializer
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import LineString


class TestAdvisorySerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.advisory = Advisory(
            advisory_title="Advisory title 1",
            advisory_active=True,
            advisory_description="Advisory description 1",   
            advisory_geometry=LineString([(-123.569743, 48.561231), 
                                          (-123.569743, 48.561231)]),
            path="000100010001",
            depth=3,
        )
        self.advisory.save()
        self.serializer = AdvisorySerializer(self.advisory)
        
    def test_serializer_valid_data(self):
        # Check if the serializer data matches the expected data
        assert self.serializer.data["advisory_title"] == \
            'Advisory title 1'
        assert self.serializer.data["advisory_active"], "The value is not True"
        assert self.serializer.data["advisory_description"] == \
            'Advisory description 1'
        assert self.serializer.data["advisory_geometry"] is not None

    def test_serializer_invalid_data(self):
        # Create a serializer with invalid data
        invalid_data = {
            'advisory_title': '',  # advisory title is required, invalid data
            'advisory_description': 'Advisory description 1',
        }
        self.serializer = AdvisorySerializer(data=invalid_data)

    def test_serializer_save(self):
        # Create a serializer with valid data to save
        valid_data = {
            'id': 3,
            'advisory_title': 'Advisory title 1',
            'advisory_active': True,
            'advisory_description': 'Advisory description 1',
            'advisory_geometry': LineString([(-123.569743, 48.561231), 
                                             (-123.569743, 48.561231)]),
            'content_type': 55,
        }
        serializer = AdvisorySerializer(data=valid_data)
        # Check if the serializer is valid
        self.assertTrue(serializer.is_valid())
        # Save the serializer data to create a new Advisory instance
        saved_advisory = serializer.save()
        assert saved_advisory.advisory_title == "Advisory title 1"