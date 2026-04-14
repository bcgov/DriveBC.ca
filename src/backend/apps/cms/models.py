import apps.cms.helptext as HelpText
from apps.shared.enums import CacheKey
from apps.shared.models import BaseModel
from config import settings
from django.contrib.gis.db import models
from django.contrib.gis.forms import OSMWidget
from django.core.cache import cache
from wagtail import blocks
from wagtail.admin.panels import FieldPanel, HelpPanel
from wagtail.api import APIField
from wagtail.contrib.table_block.blocks import TableBlock
from wagtail.fields import RichTextField, StreamField
from wagtail.images.models import Image
from wagtail.models import Page
from wagtail.templatetags import wagtailcore_tags
from wagtail.admin.panels import PageChooserPanel
from django.contrib.gis.forms import MultiPolygonField
from django.contrib.gis.geos import MultiPolygon, Polygon, GEOSGeometry
from wagtail.admin.forms import WagtailAdminPageForm

TABLE_OPTIONS = {'rowHeaders': True,
                 'colHeaders': True, }

CALLOUT_HELP_TEXT = '''
This block is for information that needs to be presented as especially important,
styled according to the BC gov't's style guide (light grey background, blue
border on the left).
'''

def reparent_orphan_advisories():
    """
    Move all Advisory pages that are not children of AdvisoryIndexPage
    to be children of the existing AdvisoryIndexPage.
    """
    index = AdvisoryIndexPage.objects.first()
    if not index:
        return

    orphans = []
    for advisory in Advisory.objects.all():
        if advisory.get_parent().specific_class != AdvisoryIndexPage:
            orphans.append(advisory)

    if not orphans:
        return

    for advisory in orphans:
        advisory.move(index, pos="first-child")  # Use "first-child" for newest on top

def reparent_orphan_bulletins():
    """
    Move all Bulletin pages that are not children of BulletinIndexPage
    to be children of the existing BulletinIndexPage.
    """
    index = BulletinIndexPage.objects.first()
    if not index:
        return

    orphans = []
    for bulletin in Bulletin.objects.all():
        if bulletin.get_parent().specific_class != BulletinIndexPage:
            orphans.append(bulletin)

    if not orphans:
        return

    for bulletin in orphans:
        bulletin.move(index, pos="first-child")  # Use "first-child" for newest on top

def get_or_create_advisory_index():
    index = AdvisoryIndexPage.objects.first()

    if index:
        actual_children_count = index.get_children().count()

        if index.numchild != actual_children_count:
            index.numchild = actual_children_count
            index.save(update_fields=["numchild"])
        reparent_orphan_advisories()

        return index

    root = Page.get_first_root_node()

    index = AdvisoryIndexPage(
        title="Advisories",
        slug="advisories",
    )

    root.add_child(instance=index)
    index.save_revision().publish()

    return index

def get_or_create_bulletin_index():
    index = BulletinIndexPage.objects.first()
    if index:
        actual_children_count = index.get_children().count()

        if index.numchild != actual_children_count:
            index.numchild = actual_children_count
            index.save(update_fields=["numchild"])

        reparent_orphan_bulletins()
        return index

    # create properly
    root = Page.get_first_root_node()

    index = BulletinIndexPage(
        title="Bulletins",
        slug="bulletins",
    )

    root.add_child(instance=index)
    index.save_revision().publish()

    return index

class FlexibleMultiPolygonField(MultiPolygonField):
    def to_python(self, value):
        if not value:
            return None
        try:
            geom = GEOSGeometry(value)
            # OSMWidget submits in 3857, label it correctly
            if not geom.srid:
                geom.srid = 3857

            if geom.geom_type == 'Polygon':
                mp = MultiPolygon(geom)
                mp.srid = 3857
                return mp
            if geom.geom_type == 'MultiPolygon':
                geom.srid = 3857
                return geom
        except Exception as e:
            print(f"DEBUG to_python error: {e}")
        return super().to_python(value)

class DriveBCMapWidget(OSMWidget):
    # Defaults to Kelowna
    default_lon = -119.49662112970556
    default_lat = 49.887338062986295
    default_zoom = 14
    template_name = 'cms/map.html'

    class Media:
        css = {
            'all': ('css/map-widget.css',)
        }
        js = (
            'js/map-widget.js',
        )

class AdvisoryAdminForm(WagtailAdminPageForm):
    geometry = FlexibleMultiPolygonField(
        widget=DriveBCMapWidget,
        required=False  # allows autosave with incomplete geometry
    )

class RichContent(blocks.StreamBlock):
    ''' Common set of rich content controls for all page types. '''

    subheading = blocks.CharBlock(template='cms/subheading.html')
    rich_text = blocks.RichTextBlock()
    table = TableBlock(table_options=TABLE_OPTIONS)
    callout = blocks.RichTextBlock(help_text=CALLOUT_HELP_TEXT,
                                   template='cms/callout.html')


class AdvisoryIndexPage(Page):
    parent_page_types = ["wagtailcore.Page"]
    subpage_types = ["cms.Advisory"]

    max_count = 1

class Advisory(Page, BaseModel):
    page_body = "Use this page for creating advisories."
    teaser = models.CharField(max_length=250, blank=True)
    body = StreamField(RichContent())
    base_form_class = AdvisoryAdminForm

    def rendered_body(self):
        blocks = [wagtailcore_tags.richtext(block.render()) for block in self.body]
        return '\n'.join(blocks)

    api_fields = [
        APIField('rendered_body'),
    ]
    parent_page_types = ["cms.AdvisoryIndexPage"]
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
            help_text=HelpText.ADVISORY_AREA,
            heading="Area",
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
        ordering = ["path"]

    @property
    def site_link(self):
        return f'{settings.FRONTEND_BASE_URL}advisories/{self.slug}'

    def save(self, *args, **kwargs):
        if self.geometry is not None:
            if self.geometry.srid == 3857 or not self.geometry.srid:
                self.geometry.srid = 3857
                self.geometry = self.geometry.transform(4326, clone=True)
        super().save(log_action=None, *args, **kwargs)
        cache.delete(CacheKey.ADVISORY_LIST)

class BulletinIndexPage(Page):
    parent_page_types = ["wagtailcore.Page"]
    subpage_types = ["cms.Bulletin"]

    max_count = 1 

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
    parent_page_types = ["cms.BulletinIndexPage"]
    subpage_types = [
        'cms.SubPage',
    ]

    def save(self, *args, **kwargs):
        super().save(log_action=None, *args, **kwargs)
        cache.delete(CacheKey.BULLETIN_LIST)

    # Editor panels configuration
    content_panels = [
        FieldPanel("title", help_text=HelpText.GENERIC_TITLE),
        FieldPanel("teaser", help_text=HelpText.GENERIC_TEASER),
        FieldPanel("image",
                   help_text=HelpText.BULLETIN_IMAGE,
                   heading="Newsfeed Image"),
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
        ordering = ["path"]


class EmergencyAlert(Page, BaseModel):
    max_count = 1
    subpage_types = ["cms.EmergencyAlertDetail"]

    alert = RichTextField(max_length=90)
    body = StreamField(RichContent(), blank=True)

    detail_page = models.ForeignKey(
        "wagtailcore.Page",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="Optional: link to an Emergency Alert detail page shown to the public.",
    )

    @property
    def detail_url(self):
        """Returns the frontend URL of the child detail page if one exists (live or draft)."""
        detail = (
            EmergencyAlertDetail.objects
            .child_of(self)
            .filter(live=True)
            .first()
        )
        if detail:
            base_url = settings.FRONTEND_BASE_URL
            return f"{base_url}emergency-alert-detail/{detail.slug}"
        return None

    def save(self, *args, **kwargs):
        super().save(log_action=None, *args, **kwargs)

    # Editor panels configuration
    content_panels = [
        HelpPanel(
            "An Emergency alert is a significant message that's shown"
            " to all users of DriveBC on every page of the site. This"
            " should only be turned on in extreme emergencies. The global"
            " teaser is the rich text field that can be used to display"
            " the message as well as adding any links for the public to"
            " get more information. Only a single emergency alert message"
            " can be shown on the site at a time."
        ),
        FieldPanel(
            "alert",
            heading='Global teaser',
            help_text='Shown in a red bar at the top of every page of DriveBC.'
                      ' Maximum length 90 characters.'
        ),
        PageChooserPanel(
            "detail_page",
            page_type="cms.EmergencyAlertDetail",
            heading="Detail page link",
            help_text="Optional: select a page that the 'Learn more' link in the teaser will navigate to.",
        ),
        FieldPanel("title", help_text='This title is for internal use within Wagtail and does not appear on DriveBC.'),
        # FieldPanel("body", help_text='Currently not used, may be used in the future for alert specific content page'),
        FieldPanel('created_at', read_only=True, heading="Created"),
        FieldPanel('first_published_at', read_only=True, heading="Published"),
        FieldPanel('last_published_at', read_only=True, heading="Updated"),
    ]
    promote_panels = []


    def get_url_parts(self, request=None):
        parts = super().get_url_parts(request)
        if parts is None:
            return None
        site_id, root_url, _ = parts
        plural = self.specific_class._meta.verbose_name_plural
        return (site_id, root_url, f'/{plural}/{self.slug}')

    class Meta:
        verbose_name_plural = 'Emergency Alert'


class EmergencyAlertDetail(Page, BaseModel):
    # Restrict to only be creatable under EmergencyAlert
    parent_page_types = ["cms.EmergencyAlert"]
    subpage_types = []  # no children allowed
    max_count_per_parent = 1  # only one detail page per alert

    body = StreamField(RichContent(), blank=True)

    content_panels = [
        FieldPanel("title", help_text="Internal title for this detail page."),
        FieldPanel("body"),
    ]
    promote_panels = []

    template = "cms/emergency-alert-detail.html"

    def get_url_parts(self, request=None):
        parts = super().get_url_parts(request)
        if parts is None:
            return None
        site_id, root_url, _ = parts
        return (site_id, root_url, f"/emergency-alert-detail/{self.slug}")

    class Meta:
        verbose_name = "Emergency Alert Detail"
        verbose_name_plural = "Emergency Alert Details"

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
