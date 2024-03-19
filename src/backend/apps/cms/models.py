import apps.cms.helptext as HelpText
from apps.shared.enums import CacheKey
from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from django.core.cache import cache
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.fields import RichTextField
from wagtail.images.models import Image
from wagtail.models import Page
from wagtail.templatetags import wagtailcore_tags


class DriveBCMapWidget(OSMWidget):
    # Defaults to Kelowna
    default_lon = -119.49662112970556
    default_lat = 49.887338062986295
    default_zoom = 14


class Advisory(Page, BaseModel):
    page_body = "Use this page for creating advisories."
    teaser = models.CharField(max_length=250, blank=True)
    body = RichTextField()

    def rendered_body(self):
        return wagtailcore_tags.richtext(self.body)

    api_fields = [
        APIField('rendered_body'),
    ]

    # Geo fields
    geometry = models.PolygonField()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        cache.delete(CacheKey.ADVISORY_LIST)

    # Editor panels configuration
    content_panels = [
        FieldPanel("title", help_text=HelpText.GENERIC_TITLE),
        FieldPanel("teaser", help_text=HelpText.GENERIC_TEASER),
        FieldPanel(
            "geometry",
            widget=DriveBCMapWidget,
            help_text=HelpText.ADVISORY_AREA
        ),
        FieldPanel("body", help_text=HelpText.GENERIC_BODY),
    ]
    promote_panels = []

    template = 'cms/advisory.html'


class Bulletin(Page, BaseModel):
    page_body = "Use this page for creating bulletins."
    teaser = models.CharField(max_length=250, blank=True)
    body = RichTextField()
    image = models.ForeignKey(Image, on_delete=models.SET_NULL, null=True, blank=False)
    image_alt_text = models.CharField(max_length=125, default='', blank=False)

    def rendered_body(self):
        return wagtailcore_tags.richtext(self.body)

    api_fields = [
        APIField('rendered_body'),
    ]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        cache.delete(CacheKey.BULLETIN_LIST)

    # Editor panels configuration
    content_panels = [
        FieldPanel("title", help_text=HelpText.GENERIC_TITLE),
        FieldPanel("teaser", help_text=HelpText.GENERIC_TEASER),
        FieldPanel("image", help_text=HelpText.BULLETIN_IMAGE),
        FieldPanel("image_alt_text", help_text=HelpText.BULLETIN_IMAGE_ALT_TEXT),
        FieldPanel("body", help_text=HelpText.GENERIC_BODY),
    ]
    promote_panels = []

    template = 'cms/bulletin.html'


class Ferry(Page, BaseModel):
    page_body = "Use this page to create or update ferry entries."

    feed_id = models.PositiveIntegerField(unique=True)

    location = models.GeometryField(blank=True, null=True)

    url = models.URLField(blank=True)
    image = models.ForeignKey(Image, on_delete=models.SET_NULL, blank=True, null=True)

    description = RichTextField(max_length=750, blank=True)
    seasonal_description = RichTextField(max_length=100, blank=True)
    service_hours = RichTextField(max_length=750, blank=True)

    feed_created_at = models.DateTimeField(auto_now_add=True)
    feed_modified_at = models.DateTimeField(auto_now=True)

    def rendered_description(self):
        return wagtailcore_tags.richtext(self.description)

    def rendered_seasonal_description(self):
        return wagtailcore_tags.richtext(self.seasonal_description)

    def rendered_service_hours(self):
        return wagtailcore_tags.richtext(self.service_hours)

    api_fields = [
        APIField('rendered_description'),
        APIField('rendered_seasonal_description'),
        APIField('rendered_service_hours'),
    ]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        cache.delete(CacheKey.FERRY_LIST)

    # Editor panels configuration
    content_panels = [
        FieldPanel("title"),
        FieldPanel("image"),
        FieldPanel("description"),
        FieldPanel("seasonal_description"),
        FieldPanel("service_hours"),
        FieldPanel("url", read_only=True),
        FieldPanel("location", widget=DriveBCMapWidget, read_only=True),
        FieldPanel("feed_created_at", read_only=True),
        FieldPanel("feed_modified_at", read_only=True),
    ]
    promote_panels = []

    template = 'cms/ferry.html'
