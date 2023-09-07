from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from wagtail.admin.panels import FieldPanel
from wagtail.fields import RichTextField
from wagtail.models import DraftStateMixin, RevisionMixin
from wagtail.search import index
from wagtail.snippets.models import register_snippet


class DriveBCMapWidget(OSMWidget):
    # Defaults to Kelowna
    default_lon = -119.49662112970556
    default_lat = 49.887338062986295
    default_zoom = 14


@register_snippet
class TestCMSData(DraftStateMixin, RevisionMixin, index.Indexed, BaseModel):
    # Text fields
    name = models.CharField(max_length=64)
    body = RichTextField(blank=True)

    # Int field
    order = models.PositiveSmallIntegerField()

    # Boolean Field
    active = models.BooleanField(default=True)

    # Other fields
    email = models.EmailField()
    url = models.URLField()

    # Geo fields
    location_geometry = models.GeometryField()

    panels = [
        FieldPanel("name"),
        FieldPanel("body"),
        FieldPanel("order"),
        FieldPanel("active"),
        FieldPanel("email"),
        FieldPanel("url"),
        FieldPanel("location_geometry", widget=DriveBCMapWidget),
    ]
