import apps.cms.helptext as HelpText
from apps.shared.enums import CacheKey
from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from django.core.cache import cache
from wagtail import blocks
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.contrib.table_block.blocks import TableBlock
from wagtail.fields import StreamField
from wagtail.images.models import Image
from wagtail.models import Page
from wagtail.templatetags import wagtailcore_tags

TABLE_OPTIONS = {'rowHeaders': True,
                 'colHeaders': True, }

CALLOUT_HELP_TEXT = '''
This block is for information that needs to be presented as especially important,
styled according to the BC gov't's style guide (light grey background, blue
border on the left).
'''


class DriveBCMapWidget(OSMWidget):
    # Defaults to Kelowna
    default_lon = -119.49662112970556
    default_lat = 49.887338062986295
    default_zoom = 14


class RichContent(blocks.StreamBlock):
    ''' Common set of rich content controls for all page types. '''

    subheading = blocks.CharBlock(template='cms/subheading.html')
    rich_text = blocks.RichTextBlock()
    table = TableBlock(table_options=TABLE_OPTIONS)
    callout = blocks.RichTextBlock(help_text=CALLOUT_HELP_TEXT,
                                   template='cms/callout.html')


class Advisory(Page, BaseModel):
    page_body = "Use this page for creating advisories."
    teaser = models.CharField(max_length=250, blank=True)
    body = StreamField(RichContent())

    def rendered_body(self):
        blocks = [wagtailcore_tags.richtext(block.render()) for block in self.body]
        return '\n'.join(blocks)

    api_fields = [
        APIField('rendered_body'),
    ]

    # Geo fields
    geometry = models.MultiPolygonField()

    def save(self, *args, **kwargs):
        super().save(log_action=None, *args, **kwargs)
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
        FieldPanel('created_at', read_only=True, heading="Created"),
        FieldPanel('first_published_at', read_only=True, heading="Published"),
        FieldPanel('last_published_at', read_only=True, heading="Updated"),
    ]
    promote_panels = []

    template = 'cms/advisory.html'

    class Meta:
        verbose_name_plural = 'advisories'


class Bulletin(Page, BaseModel):
    page_body = "Use this page for creating bulletins."
    teaser = models.CharField(max_length=250, blank=True)
    body = StreamField(RichContent())
    image = models.ForeignKey(Image, on_delete=models.SET_NULL, null=True, blank=False)
    image_alt_text = models.CharField(max_length=125, default='', blank=False)

    def rendered_body(self):
        blocks = [wagtailcore_tags.richtext(block.render()) for block in self.body]
        return '\n'.join(blocks)

    api_fields = [
        APIField('rendered_body'),
    ]

    def save(self, *args, **kwargs):
        super().save(log_action=None, *args, **kwargs)
        cache.delete(CacheKey.BULLETIN_LIST)

    # Editor panels configuration
    content_panels = [
        FieldPanel("title", help_text=HelpText.GENERIC_TITLE),
        FieldPanel("teaser", help_text=HelpText.GENERIC_TEASER),
        FieldPanel("image", help_text=HelpText.BULLETIN_IMAGE),
        FieldPanel("image_alt_text", help_text=HelpText.BULLETIN_IMAGE_ALT_TEXT),
        FieldPanel("body", help_text=HelpText.GENERIC_BODY),
        FieldPanel('created_at', read_only=True, heading="Created"),
        FieldPanel('first_published_at', read_only=True, heading="Published"),
        FieldPanel('last_published_at', read_only=True, heading="Updated"),
    ]
    promote_panels = []

    template = 'cms/bulletin.html'
