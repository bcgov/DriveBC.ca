from django.contrib.gis.db import models

from apps.shared import enums
from apps.shared.models import BaseModel


class Webcam(BaseModel):
    # Description
    name = models.CharField(max_length=128)
    caption = models.CharField(max_length=256)

    # Location
    region = models.PositiveSmallIntegerField(choices=enums.REGION_CHOICES)
    region_name = models.CharField(max_length=128)
    highway = models.CharField(max_length=32)
    highway_description = models.CharField(max_length=128)
    highway_group = models.PositiveSmallIntegerField()
    highway_cam_order = models.PositiveSmallIntegerField()
    location = models.PointField()
    orientation = models.CharField(max_length=32, choices=enums.ORIENTATION_CHOICES, null=True)
    elevation = models.PositiveSmallIntegerField()

    # General status
    is_on = models.BooleanField(default=True)
    should_appear = models.BooleanField(default=True)
    is_new = models.BooleanField(default=False)
    is_on_demand = models.BooleanField(default=False)

    # Update status
    marked_stale = models.BooleanField(default=False)
    marked_delayed = models.BooleanField(default=False)
    last_update_attempt = models.DateTimeField(null=True)
    last_update_modified = models.DateTimeField(null=True)
    update_period_mean = models.PositiveSmallIntegerField()
    update_period_stddev = models.PositiveSmallIntegerField()
