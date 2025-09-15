import apps.cms.helptext as HelpText
from apps.shared.models import BaseModel
from config import settings
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from wagtail import blocks
from wagtail.admin.panels import HelpPanel, FieldPanel
from wagtail.api import APIField
from wagtail.contrib.table_block.blocks import TableBlock
from wagtail.fields import StreamField, RichTextField
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
    template_name = 'cms/map.html'


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

    subpage_types = [
        'cms.SubPage',
    ]

    # Geo fields
    geometry = models.MultiPolygonField()

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

    def get_url_parts(self, request=None):
        parts = super().get_url_parts(request)
        if parts is None:
            return None
        site_id, root_url, _ = parts
        plural = self.specific_class._meta.verbose_name_plural
        return (site_id, root_url, f'/{plural}/{self.slug}')

    class Meta:
        # IMPORTANT: must match first segment of frontend path for advisories
        verbose_name_plural = 'advisories'

    @property
    def site_link(self):
        return f'{settings.FRONTEND_BASE_URL}advisories/{self.slug}'


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

    subpage_types = [
        'cms.SubPage',
    ]

    def save(self, *args, **kwargs):
        super().save(log_action=None, *args, **kwargs)
        # cache.delete(CacheKey.BULLETIN_LIST)

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

    def get_url_parts(self, request=None):
        parts = super().get_url_parts(request)
        if parts is None:
            return None
        site_id, root_url, _ = parts
        plural = self.specific_class._meta.verbose_name_plural
        return (site_id, root_url, f'/{plural}/{self.slug}')

    class Meta:
        # IMPORTANT: must match first segment of frontend path for bulletins
        verbose_name_plural = 'bulletins'


class EmergencyAlert(Page, BaseModel):
    max_count = 1

    alert = RichTextField(max_length=90)
    body = StreamField(RichContent(), blank=True)

    def save(self, *args, **kwargs):
        super().save(log_action=None, *args, **kwargs)

    # Editor panels configuration
    content_panels = [
        HelpPanel("An Emergency alert is a significant message that's shown to all users of DriveBC on every page of the site. This should only be turned on in extreme emergencies. The global teaser is the rich text field that can be used to display the message as well as adding any links for the public to get more information. Only a single emergency alert message can be shown on the site at a time."),
        FieldPanel("alert", heading='Global teaser', help_text='Shown in a red bar at the top of every page of DriveBC.  Maximum length 90 characters.'),
        FieldPanel("title", help_text='This title is for internal use within Wagtail and does not appear on DriveBC.' ),
        # FieldPanel("body", help_text='Currently not used, may be used in the future for alert specific content page'),
        FieldPanel('created_at', read_only=True, heading="Created"),
        FieldPanel('first_published_at', read_only=True, heading="Published"),
        FieldPanel('last_published_at', read_only=True, heading="Updated"),
    ]
    promote_panels = []

    template = 'cms/emergency-alert.html'

    def get_url_parts(self, request=None):
        parts = super().get_url_parts(request)
        if parts is None:
            return None
        site_id, root_url, _ = parts
        plural = self.specific_class._meta.verbose_name_plural
        return (site_id, root_url, f'/{plural}/{self.slug}')

    class Meta:
        verbose_name_plural = 'Emergency Alert'


class SubPage(Page, BaseModel):
    '''
    A page specifically for subpages of Advisories/Bulletins.

    We use a specific subpage model so that child pages don't have the same
    requirements as a parent page (e.g., the geometry field of an advisory).
    This means that subpages, as children, aren't automatically included in an
    API call retrieving all Advisories/Bulletins, so they need to be manually
    requested or included in the serialization of an Advisory/Bulletin.  The
    frontend benefits from this by not having to distinguish top level pages
    from subpages in parsing the list of Advisories/Bulletins.

    Subpages are restricted to having a parent page type of Advisory/Bulletin;
    they cannot be created as standalone pages.  Likewise, Advisory/Bulletin
    pages are restricted to creating subpages for children.
    '''

    body = StreamField(RichContent())

    api_fields = [
        APIField('rendered_body'),
    ]

    parent_page_types = [
        'cms.Advisory',
        'cms.Bulletin',
    ]

    def rendered_body(self):
        blocks = [wagtailcore_tags.richtext(block.render()) for block in self.body]
        return '\n'.join(blocks)

    def save(self, *args, **kwargs):
        super().save(log_action=None, *args, **kwargs)
        # cache.delete(CacheKey.BULLETIN_LIST)

    # Editor panels configuration
    content_panels = [
        FieldPanel("title", help_text=HelpText.GENERIC_TITLE),
        FieldPanel("body", help_text=HelpText.GENERIC_BODY),
        FieldPanel('created_at', read_only=True, heading="Created"),
        FieldPanel('first_published_at', read_only=True, heading="Published"),
        FieldPanel('last_published_at', read_only=True, heading="Updated"),
    ]

    promote_panels = []

    def get_url_parts(self, request=None):
        parent = self.get_parent()
        parts = parent.get_url_parts(request)
        if parts is None:
            return None
        site_id, root_url, _ = parts
        # absolute path is required for links between subpages to function
        plural = parent.specific_class._meta.verbose_name_plural
        return (site_id, root_url, f'/{plural}/{parent.slug}/{self.slug}')
