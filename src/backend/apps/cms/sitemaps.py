from urllib.parse import urlsplit

from apps.cms.models import Advisory, Bulletin, EmergencyAlertDetail, SubPage
from apps.webcam.models import Webcam
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.contrib.sitemaps import Sitemap
from wagtail.models import Page


class FrontendSitemap(Sitemap):
    def _frontend_url(self):
        frontend_url = urlsplit(settings.FRONTEND_BASE_URL)
        if frontend_url.scheme not in {"http", "https"} or not frontend_url.netloc:
            raise ImproperlyConfigured(
                "FRONTEND_BASE_URL must be an absolute HTTP(S) URL for the sitemap."
            )
        return frontend_url

    def get_domain(self, site=None):
        return self._frontend_url().netloc

    def get_protocol(self, protocol=None):
        return self._frontend_url().scheme


class StaticPageSitemap(FrontendSitemap):
    priority = 0.7
    changefreq = "weekly"

    def items(self):
        return [
            "/",
            "/cameras",
            "/delays",
            "/chain-ups",
            "/advisories",
            "/bulletins",
            "/problems",
        ]

    def location(self, item):
        return item


class CameraSitemap(FrontendSitemap):
    changefreq = "daily"
    priority = 0.6

    def items(self):
        return Webcam.objects.filter(should_appear=True).order_by("pk")

    def location(self, item):
        return f"/cameras/{item.pk}"


class AdvisorySitemap(FrontendSitemap):
    changefreq = "daily"
    priority = 0.8

    def items(self):
        return Advisory.objects.live()

    def location(self, item):
        return f"/advisories/{item.slug}"

    def lastmod(self, item):
        return item.last_published_at


class BulletinSitemap(FrontendSitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return Bulletin.objects.live()

    def location(self, item):
        return f"/bulletins/{item.slug}"

    def lastmod(self, item):
        return item.last_published_at


class SubPageSitemap(FrontendSitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        parents_by_path = {
            page.path: (page.slug, page.content_type.model)
            for page in Page.objects.live()
            .filter(content_type__model__in=("advisory", "bulletin"))
            .select_related("content_type")
        }
        subpages = []
        for page in SubPage.objects.live():
            parent = parents_by_path.get(page.path[:-Page.steplen])
            if parent:
                parent_slug, model = parent
                plural = "advisories" if model == "advisory" else "bulletins"
                subpages.append((page, plural, parent_slug))
        return subpages

    def location(self, item):
        page, plural, parent_slug = item
        return f"/{plural}/{parent_slug}/{page.slug}"

    def lastmod(self, item):
        page, _, _ = item
        return page.last_published_at


class EmergencyAlertDetailSitemap(FrontendSitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return EmergencyAlertDetail.objects.live()

    def location(self, item):
        return f"/emergency-alert-detail/{item.slug}"

    def lastmod(self, item):
        return item.last_published_at
