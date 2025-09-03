from apps.shared.models import BaseModel
from django.contrib.gis.db import models


class Wildfire(BaseModel):
    id = models.CharField(max_length=128, primary_key=True)
    url = models.URLField(null=True, blank=True)
    name = models.CharField(max_length=256, null=True, blank=True, default='')

    geometry = models.GeometryField()
    location = models.PointField()

    size = models.FloatField()
    status = models.CharField(max_length=128)

    reported_date = models.DateField()
