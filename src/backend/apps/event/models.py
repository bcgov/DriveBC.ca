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

    # Location
    direction = models.CharField(max_length=32)
    location = models.GeometryField()
    polygon = models.GeometryField(null=True)
    route_at = models.CharField(max_length=128)
    route_from = models.CharField(max_length=128)
    route_to = models.CharField(max_length=128, blank=True)

    # CARS API info
    highway_segment_names = models.CharField(max_length=256, blank=True, default='')
    location_description = models.CharField(max_length=256, blank=True, default='')
    closest_landmark = models.CharField(max_length=256, blank=True, default='')
    next_update = models.DateTimeField(null=True, blank=True)
    start_point_linear_reference = models.FloatField(null=True)

    # Update status
    first_created = models.DateTimeField()
    last_updated = models.DateTimeField()

    # Schedule
    schedule = models.JSONField(default=dict)

    # Scheduled start and end
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)

    def save(self, *args, **kwargs):
        # Put buffer on road condition LineStrings on creation only
        if self._state.adding and self.location and self.location.geom_type == 'LineString' and self.pk.startswith('DBCRCON'):
            self.location.transform(3857)  # Transform to 3857 before adding buffer
            self.polygon = self.location.buffer_with_style(2000, end_cap_style=2)  # 2km buffer

            # Transform back to 4326 before updating
            self.location.transform(4326)
            self.polygon.transform(4326)

        super().save(*args, **kwargs)
