import logging

from apps.cms.models import Ferry
from apps.cms.views import FerryAPI
from apps.feed.client import FeedClient
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from django.core.exceptions import ObjectDoesNotExist
from django.utils.text import slugify
from wagtail.models import Page

logger = logging.getLogger(__name__)


def populate_ferry_from_data(ferry_data):
    ferry_id = ferry_data.get('id')

    try:
        ferry = Ferry.objects.get(id=ferry_id)

    except ObjectDoesNotExist:
        # Generate Page associated with ferry obj
        root_page = Page.get_root_nodes()[0]

        # New ferry obj
        ferry = Ferry(
            title=ferry_data['title'],
            slug=slugify(ferry_data['title']),
            content_type=ContentType.objects.get_for_model(Ferry),
        )

        root_page.add_child(instance=ferry)
        ferry.save_revision().publish()

    ferry.location = Point(ferry_data['location']['coordinates'])
    ferry.url = ferry_data['url']
    ferry.feed_created_at = ferry_data['feed_created_at']
    ferry.feed_modified_at = ferry_data['feed_modified_at']
    ferry.save()


def populate_all_ferry_data():
    feed_data = FeedClient().get_ferries_list()['features']
    for ferry_data in feed_data:
        populate_ferry_from_data(ferry_data)

    # Rebuild cache
    FerryAPI().set_list_data()
