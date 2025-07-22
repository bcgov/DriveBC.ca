from django.db import models

class ImageIndex(models.Model):
    camera_id = models.TextField()  # NOT NULL by default requires null=False
    original_pvc_path = models.TextField(blank=True, null=True)
    watermarked_pvc_path = models.TextField(blank=True, null=True)
    original_s3_path = models.TextField(blank=True, null=True)
    watermarked_s3_path = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField()  # TIMESTAMPTZ is handled automatically

    class Meta:
        db_table = "image_index"  # Use the same table name as before
