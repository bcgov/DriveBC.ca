from apps.shared.models import BaseModel
from django.contrib.gis.db import models


class Event(BaseModel):
    id = models.CharField(max_length=32, primary_key=True)

    # Description
    description = models.CharField(max_length=1024)
    event_type = models.CharField(max_length=32)
    event_sub_type = models.CharField(max_length=32, blank=True, default='')

    # General status
    status = models.CharField(max_length=32)
    severity = models.CharField(max_length=32)
    closed = models.BooleanField(default=False)
    priority = models.PositiveIntegerField(default=0)

    # Location
    direction = models.CharField(max_length=32)
    location = models.GeometryField()
    route_at = models.CharField(max_length=128)
    route_from = models.CharField(max_length=128)
    route_to = models.CharField(max_length=128, blank=True)

    # CARS API info
    highway_segment_names = models.CharField(max_length=256, blank=True, default='')
    location_description = models.CharField(max_length=256, blank=True, default='')
    closest_landmark = models.CharField(max_length=256, blank=True, default='')
    next_update = models.DateTimeField(null=True, blank=True)

    # Update status
    first_created = models.DateTimeField()
    last_updated = models.DateTimeField()

    # Schedule
    schedule = models.JSONField(default={})

    # Scheduled start and end
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
