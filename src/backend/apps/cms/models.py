from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from wagtail.admin.panels import FieldPanel
from wagtail.fields import RichTextField
from wagtail.models import DraftStateMixin, RevisionMixin
from wagtail.search import index
from wagtail.snippets.models import register_snippet


class DriveBCMapWidget(OSMWidget):
    # Defaults to Downtown Vancouver
    default_lon = -123.11768530084888
    default_lat = 49.28324595133542
    default_zoom = 14


@register_snippet
class FAQ(DraftStateMixin, RevisionMixin, index.Indexed, BaseModel):
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
