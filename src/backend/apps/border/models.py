from apps.border.enums import LANE_DIRECTION_CHOICES, LANE_TYPE_CHOICES
from apps.shared.models import BaseModel
from django.contrib.gis.db import models


class BorderCrossing(BaseModel):
    id = models.PositiveSmallIntegerField(primary_key=True)
    name = models.CharField(max_length=128)
    location = models.PointField()
    schedule_url = models.URLField(null=True, blank=True)


class BorderCrossingLanes(BaseModel):
    id = models.PositiveSmallIntegerField(primary_key=True)
    border_crossing = models.ForeignKey(BorderCrossing, on_delete=models.CASCADE)

    lane_type = models.CharField(max_length=64, choices=LANE_TYPE_CHOICES)
    lane_direction = models.CharField(max_length=64, choices=LANE_DIRECTION_CHOICES)

    delay_minutes = models.PositiveSmallIntegerField(blank=True, null=True)

    last_updated = models.DateTimeField(blank=True, null=True)
