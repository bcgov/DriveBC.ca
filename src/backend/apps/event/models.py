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
        uses_polygon = self.event_type in ['ROAD_CONDITION']  # chain up not used for now
        width = 1500 if self.event_type == 'CHAIN_UP' else 2000

        # For road conditions or chain up events with linestring geometry
        # generate a polygon based on the linestring
        if uses_polygon and self.location and self.location.geom_type == 'LineString':
            # Transform to SRID 3857 before generating buffer for better
            # looking polygon; under 4326, the shape looks skewed
            self.location.transform(3857)
            self.polygon = self.location.buffer_with_style(width, end_cap_style=2)

            # Transform back to 4326 before saving because we emit lng/lat
            self.location.transform(4326)
            self.polygon.transform(4326)

        super().save(*args, **kwargs)
