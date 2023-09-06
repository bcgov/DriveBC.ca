from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from wagtail.admin.panels import FieldPanel
from wagtail.fields import RichTextField
from wagtail.models import DraftStateMixin, RevisionMixin
from wagtail.search import index
from wagtail.snippets.models import register_snippet

from wagtail.templatetags import wagtailcore_tags
from wagtail.api import APIField


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


@register_snippet
class Bulletin(DraftStateMixin, RevisionMixin, index.Indexed, BaseModel):
    # Title field for the advisory
    bulletin_title = models.CharField(max_length=255)

    # Teaser field for a brief description
    bulletin_teaser = models.TextField()

    # Rich text field for the body content
    bulletin_body = RichTextField(blank=True)
    
    def rendered_body(self):
        return wagtailcore_tags.richtext(self.bulletin_body)

    api_fields = [
        APIField('rendered_body'),
    ]

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
    
    def rendered_body(self):
        return wagtailcore_tags.richtext(self.advisory_body)

    api_fields = [
        APIField('rendered_body'),
    ]

    # Geo fields
    location_geometry = models.GeometryField()

    panels = [
        FieldPanel("advisory_title"),
        FieldPanel("advisory_teaser"),
        FieldPanel("advisory_body"),
        FieldPanel("location_geometry", widget=DriveBCMapWidget),
    ]
