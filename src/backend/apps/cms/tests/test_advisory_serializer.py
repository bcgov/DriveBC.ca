from apps.cms.models import Advisory
from apps.cms.serializers import AdvisorySerializer, AdvisoryTestSerializer
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import MultiPolygon, Polygon


class TestAdvisorySerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.advisory = Advisory(
            title="Advisory title 1",
            body='[{"id": "1", "type": "rich_text", "value": "Advisory body 1"}]',
            geometry=MultiPolygon(Polygon([
                (-123.569743, 48.561231),
                (-123.569743, 48.561231),
                (-123.569743, 48.561231),
                (-123.569743, 48.561231)
            ])),
            path="000100010001",
            depth=3,
        )
        self.advisory.rendered_body()
        self.advisory.save()
        self.serializer = AdvisorySerializer(self.advisory)

    def test_serializer_valid_data(self):
        # Check if the serializer data matches the expected data
        assert self.serializer.data["title"] == \
            'Advisory title 1'
        assert self.serializer.data["body"] == \
            'Advisory body 1'
        assert self.serializer.data["geometry"] is not None

    def test_serializer_invalid_data(self):
        # Create a serializer with invalid data
        invalid_data = {
            'title': '',  # advisory title is required, invalid data
            'body': 'Advisory body 1',
        }
        self.serializer = AdvisorySerializer(data=invalid_data)

    def test_serializer_save(self):
        # Create a serializer with valid data to save
        valid_data = {
            'id': 3,
            'title': 'Advisory title 1',
            'body': '[{"id": "1", "type": "rich_text", "value": "Advisory body 1"}]',
            'geometry': MultiPolygon(Polygon([
                (-123.569743, 48.561231),
                (-123.569743, 48.561231),
                (-123.569743, 48.561231),
                (-123.569743, 48.561231)
            ])),
            'content_type': 55,
            'depth': 1,
            'path': '000100010005',
            'numchild': 0,
            'slug': 'title1',
        }
        # Use test serializer to avoid overriding fields
        serializer = AdvisoryTestSerializer(data=valid_data)
        # Check if the serializer is valid
        assert serializer.is_valid() is True
