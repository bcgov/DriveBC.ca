from apps.shared.models import BaseModel
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.gis.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.conf import settings

class TravelAdvisoryMessage(BaseModel):
    title = models.CharField(max_length=255)
    text = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    pub_date = models.DateTimeField(
        verbose_name="Publication date", null=True, blank=True
    )

    class Meta:
        verbose_name = "Travel Advisory Message"

    def __str__(self):
        return f"{self.title}"

    @admin.display(
        boolean=True,
        ordering="pub_date",
        description="Is published",
    )
    def is_published(self):
        now = timezone.now()
        return self.pub_date is not None and self.pub_date <= now


class Route(BaseModel):
    FASTEST = "fastest"
    SHORTEST = "shortest"
    CRITERIA_CHOICES = [(FASTEST, "Fastest"), (SHORTEST, "Shortest")]
    KILOMETRES = "km"
    MILES = "mi"
    DISTANCE_UNIT_CHOICES = [(KILOMETRES, "km"), (MILES, "mi")]
    name = models.CharField(max_length=255)
    email = models.EmailField()
    start_point = models.PointField()
    destination_point = models.PointField()
    route_points = models.LineStringField()
    criteria = models.CharField(
        choices=CRITERIA_CHOICES, default=FASTEST, max_length=10
    )
    srs_code = models.CharField(max_length=5)
    distance_unit = models.CharField(
        choices=DISTANCE_UNIT_CHOICES, default=KILOMETRES, max_length=2
    )
    distance = models.FloatField(help_text="Length of route in distance units")
    route_time = models.FloatField(help_text="Duration in seconds")

    @cached_property
    def bbox(self):
        return self.route_points.extent
