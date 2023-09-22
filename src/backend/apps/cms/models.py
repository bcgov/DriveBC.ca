from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.fields import RichTextField
from wagtail.models import Page
from wagtail.templatetags import wagtailcore_tags


class DriveBCMapWidget(OSMWidget):
    # Defaults to Kelowna
    default_lon = -119.49662112970556
    default_lat = 49.887338062986295
    default_zoom = 14


class Advisory(Page, BaseModel):
    page_description = "Use this page for creating advisories"
    active = models.BooleanField(default=True)
    description = RichTextField(blank=True)

    def rendered_description(self):
        return wagtailcore_tags.richtext(self.description)

    api_fields = [
        APIField('rendered_description'),
    ]

    # Geo fields
    geometry = models.GeometryField()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    # Editor panels configuration
    content_panels = [
        FieldPanel("title"),
        FieldPanel("active"),
        FieldPanel("description"),
        FieldPanel("geometry", widget=DriveBCMapWidget),

    ]
    promote_panels = []

    template = 'cms/advisory.html'
