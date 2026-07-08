from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django_prometheus.models import ExportModelOperationsMixin


class Wildfire(ExportModelOperationsMixin('wildfire'), BaseModel):
    id = models.CharField(max_length=128, primary_key=True)
    url = models.URLField(null=True, blank=True)
    name = models.CharField(max_length=256, null=True, blank=True, default='')

    geometry = models.GeometryField()
    location = models.PointField()

    size = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=128, blank=True, default='')
    wildfire_of_note = models.BooleanField(default=False)

    reported_date = models.DateField()
