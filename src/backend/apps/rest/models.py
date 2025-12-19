from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point
from django_prometheus.models import ExportModelOperationsMixin


class RestStop(ExportModelOperationsMixin('rest_stops'), BaseModel):
    rest_stop_id = models.CharField(max_length=100, null=True)
    location = models.PointField(null=True)
    geometry = models.JSONField(null=True)
    properties = models.JSONField(null=True)
    bbox = models.JSONField(null=True)

    def __str__(self):
        return f"Rest Stop for {self.pk}"

    def save(self, *args, **kwargs):
        latitude, longitude = self.geometry.get("coordinates")[1], self.geometry.get("coordinates")[0]
        self.location = Point(longitude, latitude)
        super().save(*args, **kwargs)
