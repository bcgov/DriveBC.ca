import os
from io import BytesIO

from apps.cms.models import Bulletin
from apps.cms.serializers import BulletinSerializer, BulletinTestSerializer
from apps.shared.tests import BaseTest
from django.core.files.images import ImageFile
from wagtail.images.models import Image


class TestBulletinSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        # Programatically create wagtail image file
        img_directory = os.path.dirname(__file__)
        filename = 'testimg.png'
        path = f"{img_directory}/{filename}"
        img_bytes = open(path, "rb").read()
        img_file = ImageFile(BytesIO(img_bytes), name=filename)

        img_obj = Image(title=filename, file=img_file, width=165, height=51)
        img_obj.save()
        self.img_obj = img_obj

        self.bulletin = Bulletin(
            title="Bulletin title 1",
            body='[{"id": "1", "type": "rich_text", "value": "Bulletin body 1"}]',
            path="000100010001",
            depth=3,
            image=img_obj,
            image_alt_text='Some Image Alt text',
        )

        self.bulletin.rendered_body()
        self.bulletin.save()
        self.serializer = BulletinTestSerializer(self.bulletin)

    def test_serializer_valid_data(self):
        # Check if the serializer data matches the expected data
        assert self.serializer.data["title"] == \
            'Bulletin title 1'
        assert self.serializer.data["body"] == \
            '[{"type": "rich_text", "value": "Bulletin body 1", "id": "1"}]'

    def test_serializer_invalid_data(self):
        # Create a serializer with invalid data
        invalid_data = {
            'title': '',  # bulletin title is required, invalid data
            'body': '[{"id": "1", "type": "rich_text", "value": "Bulletin body 1"}]',
        }
        self.serializer = BulletinSerializer(data=invalid_data)

    def test_serializer_save(self):
        # Create a serializer with valid data to save
        valid_data = {
            'id': 3,
            'title': 'Bulletin title 1',
            'body': '[{"id": "1", "type": "rich_text", "value": "Bulletin body 1"}]',
            'content_type': 55,
            'image': self.img_obj.id,
            'image_alt_text': 'Some Image Alt text',
            'depth': 1,
            'path': '000100010005',
            'numchild': 0,
            'slug': 'title1',
        }
        serializer = BulletinTestSerializer(data=valid_data)
        # Check if the serializer is valid
        # assert serializer.is_valid() is True
        serializer.is_valid()
        # Save the serializer data to create a new Bulletin instance
        saved_bulletin = serializer.save()
        assert saved_bulletin.title == "Bulletin title 1"
