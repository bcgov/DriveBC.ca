from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from wagtail.admin.panels import FieldPanel
from wagtail.fields import RichTextField
from wagtail.models import DraftStateMixin, RevisionMixin
from wagtail.search import index
from wagtail.snippets.models import register_snippet
from wagtail.models import Page
from wagtail.api import APIField
from wagtail.templatetags import wagtailcore_tags
# from django import forms


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


class Advisory(Page, BaseModel):
    page_description = "Use this page for creating advisories"
    # Title field for the advisory
    advisory_title = models.CharField(max_length=255)
    advisory_active = models.BooleanField(default=True)

    # Teaser field for a brief description
    # advisory_teaser = models.TextField()

    # Rich text field for the body content
    advisory_description = RichTextField(blank=True)
    
    def rendered_description(self):
        return wagtailcore_tags.richtext(self.advisory_description)

    api_fields = [
        APIField('rendered_description'),
    ]

    # Geo fields
    advisory_geometry = models.GeometryField()

    def save(self, *args, **kwargs):
        self.title = self.advisory_title
        super().save(*args, **kwargs)

    # Editor panels configuration
    content_panels = [
        # FieldPanel("page_ptr"),
        # FieldPanel("title"),
        # FieldPanel("depth"),
        # FieldPanel("path"),
        # FieldPanel("numchild"),
        FieldPanel("advisory_title"),
        FieldPanel("advisory_active"),
        # FieldPanel("advisory_teaser"),
        FieldPanel("advisory_description"),
        FieldPanel("advisory_geometry", widget=DriveBCMapWidget),
    ]
    promote_panels = []

    # Parent page / subpage type rules
    # parent_page_types = ['wagtailcore.Page']
    # subpage_types = []

    template = 'cms/advisory.html'