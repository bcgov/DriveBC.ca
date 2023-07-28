from apps.shared.models import BaseModel
from django.contrib.gis.db import models


class Event(BaseModel):
    id = models.CharField(max_length=32, primary_key=True)

    # Description
    description = models.CharField(max_length=1024)
    event_type = models.CharField(max_length=32)
    event_sub_type = models.CharField(max_length=32)

    # General status
    status = models.CharField(max_length=32)
    severity = models.CharField(max_length=32)

    # Location
    direction = models.CharField(max_length=32)
    location = models.GeometryField()
    route = models.CharField(max_length=128)

    # Update status
    first_created = models.DateTimeField()
    last_updated = models.DateTimeField()
