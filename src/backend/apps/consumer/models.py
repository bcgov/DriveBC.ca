from django.db import models
from apps.shared.models import BaseModel

class ImageIndex(BaseModel):
    camera_id = models.TextField()
    original_pvc_path = models.TextField(blank=True, null=True)
    watermarked_pvc_path = models.TextField(blank=True, null=True)
    original_s3_path = models.TextField(blank=True, null=True)
    watermarked_s3_path = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField()

    class Meta:
        db_table = "image_index"
