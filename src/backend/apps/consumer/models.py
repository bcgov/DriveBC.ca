from django.db import models
from apps.shared.models import BaseModel

class ImageIndex(BaseModel):
    camera_id = models.TextField()
    timestamp = models.DateTimeField()

    class Meta:
        db_table = "image_index"
