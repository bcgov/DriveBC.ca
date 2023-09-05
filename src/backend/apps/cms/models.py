from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from wagtail.admin.panels import FieldPanel
from wagtail.fields import RichTextField
from wagtail.models import DraftStateMixin, RevisionMixin
from wagtail.search import index
from wagtail.snippets.models import register_snippet
# from modelcluster.fields import ParentalKey


class DriveBCMapWidget(OSMWidget):
    # Defaults to Downtown Vancouver
    default_lon = -123.11768530084888
    default_lat = 49.28324595133542
    default_zoom = 14


class MyMapWidget(OSMWidget):
    # Defaults to Downtown Vancouver
    default_lon = -123.396740
    default_lat = 48.472620
    default_zoom = 14


@register_snippet
class Bulletin(DraftStateMixin, RevisionMixin, index.Indexed, BaseModel):
    # Title field for the advisory
    bulletin_title = models.CharField(max_length=255)

    # Teaser field for a brief description
    bulletin_teaser = models.TextField()

    # Rich text field for the body content
    bulletin_body = RichTextField(blank=True)

    panels = [
        FieldPanel("bulletin_title"),
        FieldPanel("bulletin_teaser"),
        FieldPanel("bulletin_body"),
    ]


@register_snippet
class Advisory(DraftStateMixin, RevisionMixin, index.Indexed, BaseModel):
    # Title field for the advisory
    advisory_title = models.CharField(max_length=255)

    # Teaser field for a brief description
    advisory_teaser = models.TextField()

    # Rich text field for the body content
    advisory_body = RichTextField(blank=True)

    # Geo fields
    location_geometry = models.GeometryField()

    panels = [
        FieldPanel("advisory_title"),
        FieldPanel("advisory_teaser"),
        FieldPanel("advisory_body"),
        FieldPanel("location_geometry", widget=MyMapWidget),
    ]
