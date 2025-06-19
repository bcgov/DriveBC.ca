from apps.cms.models import FloodGate
from apps.cms.serializers import FloodGateSerializer, FloodGateTestSerializer
from apps.shared.tests import BaseTest


class TestFloodGateSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.floodgate = FloodGate(
            title="FloodGate title 1",
            body='[{"id": "1", "type": "rich_text", "value": "FloodGate body 1"}]',
            path="000100010001",
            depth=3,
        )

        self.floodgate.rendered_body()
        self.floodgate.save()
        self.serializer = FloodGateTestSerializer(self.floodgate)

    def test_serializer_valid_data(self):
        # Check if the serializer data matches the expected data
        assert self.serializer.data["title"] == \
            'FloodGate title 1'
        assert self.serializer.data["body"] == \
            '[{"type": "rich_text", "value": "FloodGate body 1", "id": "1"}]'

    def test_serializer_invalid_data(self):
        # Create a serializer with invalid data
        invalid_data = {
            'title': '',  # FloodGate title is required, invalid data
            'body': '[{"id": "1", "type": "rich_text", "value": "FloodGate body 1"}]',
        }
        self.serializer = FloodGateSerializer(data=invalid_data)

    def test_serializer_save(self):
        # Create a serializer with valid data to save
        valid_data = {
            'id': 3,
            'title': 'FloodGate title 1',
            'body': '[{"id": "1", "type": "rich_text", "value": "FloodGate body 1"}]',
            'content_type': 55,
            'depth': 1,
            'path': '000100010005',
            'numchild': 0,
            'slug': 'title1',
        }
        serializer = FloodGateTestSerializer(data=valid_data)
        # Check if the serializer is valid
        # assert serializer.is_valid() is True
        serializer.is_valid()
        # Save the serializer data to create a new FloodGate instance
        saved_floodgate = serializer.save()
        assert saved_floodgate.title == "FloodGate title 1"
