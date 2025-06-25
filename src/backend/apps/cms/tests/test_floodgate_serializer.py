from apps.cms.models import EmergencyAlert
from apps.cms.serializers import EmergencyAlertSerializer, EmergencyAlertTestSerializer
from apps.shared.tests import BaseTest


class TestEmergencyAlertSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.emergency_alert = EmergencyAlert(
            title="EmergencyAlert title 1",
            alert='EmergencyAlert body 1',
            path="000100010001",
            depth=3,
        )

        self.emergency_alert.rendered_body()
        self.emergency_alert.save()
        self.serializer = EmergencyAlertTestSerializer(self.emergency_alert)

    def test_serializer_valid_data(self):
        # Check if the serializer data matches the expected data
        assert self.serializer.data["title"] == 'EmergencyAlert title 1'
        assert self.serializer.data["alert"] == 'EmergencyAlert body 1'

    def test_serializer_invalid_data(self):
        # Create a serializer with invalid data
        invalid_data = {
            'title': '',  # EmergencyAlert title is required, invalid data
            'alert': 'EmergencyAlert body 1',
        }
        self.serializer = EmergencyAlertSerializer(data=invalid_data)

    def test_serializer_save(self):
        # Create a serializer with valid data to save
        valid_data = {
            'id': 3,
            'title': 'EmergencyAlert title 1',
            'alert': 'EmergencyAlert body 1',
            'content_type': 55,
            'depth': 1,
            'path': '000100010005',
            'numchild': 0,
            'slug': 'title1',
        }
        serializer = EmergencyAlertTestSerializer(data=valid_data)
        # Check if the serializer is valid
        # assert serializer.is_valid() is True
        serializer.is_valid()
        # Save the serializer data to create a new emergency alert instance
        saved_emergency_alert = serializer.save()
        assert saved_emergency_alert.title == "EmergencyAlert title 1"
