from apps.cms.models import Bulletin
from apps.cms.serializers import BulletinSerializer
from apps.shared.tests import BaseTest


class TestBulletinSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.bulletin = Bulletin(
            title="Bulletin title 1",
            body="Bulletin body 1",
            path="000100010001",
            depth=3,
        )
        self.bulletin.save()
        self.serializer = BulletinSerializer(self.bulletin)

    def test_serializer_valid_data(self):
        # Check if the serializer data matches the expected data
        assert self.serializer.data["title"] == \
            'Bulletin title 1'
        assert self.serializer.data["body"] == \
            'Bulletin body 1'

    def test_serializer_invalid_data(self):
        # Create a serializer with invalid data
        invalid_data = {
            'title': '',  # bulletin title is required, invalid data
            'body': 'Bulletin body 1',
        }
        self.serializer = BulletinSerializer(data=invalid_data)

    def test_serializer_save(self):
        # Create a serializer with valid data to save
        valid_data = {
            'id': 3,
            'title': 'Bulletin title 1',
            'body': 'Bulletin body 1',
            'content_type': 55,
            'depth': 1,
            'path': '000100010005',
            'numchild': 0,
            'slug': 'title1',
        }
        serializer = BulletinSerializer(data=valid_data)
        # Check if the serializer is valid
        assert serializer.is_valid() is True
        # Save the serializer data to create a new Bulletin instance
        saved_bulletin = serializer.save()
        assert saved_bulletin.title == "Bulletin title 1"
