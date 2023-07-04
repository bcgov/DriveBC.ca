from apps.event import enums as event_enums
from apps.shared.models import BaseModel
from django.contrib.gis.db import models


class Event(BaseModel):
    id = models.CharField(max_length=32, primary_key=True)

    # Description
    description = models.CharField(max_length=256)
    event_type = models.CharField(max_length=32, choices=event_enums.EVENT_TYPE_CHOICES)
    event_sub_type = models.CharField(
        max_length=32, choices=event_enums.EVENT_SUB_TYPE_CHOICES
    )

    # General status
    status = models.CharField(max_length=32, choices=event_enums.EVENT_STATUS_CHOICES)
    severity = models.CharField(
        max_length=32, choices=event_enums.EVENT_SEVERITY_CHOICES
    )

    # Location
    direction = models.CharField(
        max_length=32,
        choices=event_enums.EVENT_DIRECTION_CHOICES,
    )
    location = models.LineStringField()
    route = models.CharField(max_length=128)

    # Update status
    first_created = models.DateTimeField(null=True)
    last_updated = models.DateTimeField(null=True)
