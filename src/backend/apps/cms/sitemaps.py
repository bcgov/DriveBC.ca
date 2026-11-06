from datetime import timedelta
from urllib.parse import urlsplit

from apps.cms.models import Advisory, Bulletin, EmergencyAlertDetail, SubPage
from apps.ferry.models import CoastalFerryStop, Ferry
from apps.rest.models import RestStop
from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from apps.webcam.models import Webcam
from django.conf import settings
from django.contrib.sitemaps import Sitemap
from django.core.exceptions import ImproperlyConfigured
from django.db.models import Q
from django.utils import timezone
from wagtail.models import Page


class FrontendSitemap(Sitemap):
    """Builds URLs on FRONTEND_BASE_URL; items are frontend paths unless location() is overridden."""

    def _frontend_url(self):
        frontend_url = urlsplit(settings.FRONTEND_BASE_URL)
        if frontend_url.scheme not in {"http", "https"} or not frontend_url.netloc:
            raise ImproperlyConfigured("FRONTEND_BASE_URL must be an absolute HTTP(S) URL for the sitemap.")
        return frontend_url

    def get_domain(self, site=None):
        return self._frontend_url().netloc

    def get_protocol(self, protocol=None):
        return self._frontend_url().scheme

    def location(self, item):
        return item


class StaticPageSitemap(FrontendSitemap):
    def items(self):
        return [
            "/",
            "/cameras",
            "/delays",
            "/chain-ups",
            "/advisories",
            "/bulletins",
            "/problems",
            "/feedback",
            "/highway-problem",
            "/road-electrical-problem",
        ]


class CameraSitemap(FrontendSitemap):
    def items(self):
        cameras = Webcam.objects.filter(should_appear=True).order_by("pk")
        return [f"/cameras/{pk}" for pk in cameras.values_list("pk", flat=True)]


class FerrySitemap(FrontendSitemap):
    def items(self):
        inland_ids = Ferry.objects.order_by().values_list("route_id", flat=True).distinct()
        # only coastal terminals with scheduled trips, on the stop or its child stops
        coastal_ids = (
            CoastalFerryStop.objects.filter(parent_stop=None)
            .filter(
                Q(stop_times__trip__route__isnull=False)
                | Q(child_stops__stop_times__trip__route__isnull=False)
            )
            .values_list("id", flat=True)
            .distinct()
        )
        return [f"/ferry/{pk}" for pk in inland_ids] + [f"/coastal-ferry/{pk}" for pk in coastal_ids]


class RestStopSitemap(FrontendSitemap):
    def items(self):
        return [f"/rest-stop/{pk}" for pk in RestStop.objects.order_by("pk").values_list("pk", flat=True)]


class WeatherSitemap(FrontendSitemap):
    def items(self):
        roadside = CurrentWeather.objects.exclude(code=None).order_by("pk")
        regional = RegionalWeather.objects.exclude(code=None).order_by("pk")
        high_elevation = HighElevationForecast.objects.filter(
            issued_utc__gte=timezone.now() - timedelta(hours=24)
        ).order_by("pk")
        return (
            [f"/roadside-weather/{pk}" for pk in roadside.values_list("pk", flat=True)]
            + [f"/regional-weather/{pk}" for pk in regional.values_list("pk", flat=True)]
            + [f"/high-elevation-weather/{pk}" for pk in high_elevation.values_list("pk", flat=True)]
        )


class CmsPageSitemap(FrontendSitemap):
    def lastmod(self, item):
        return item.last_published_at


class AdvisorySitemap(CmsPageSitemap):
    def items(self):
        return Advisory.objects.live()

    def location(self, item):
        return f"/advisories/{item.slug}"


class BulletinSitemap(CmsPageSitemap):
    def items(self):
        return Bulletin.objects.live()

    def location(self, item):
        return f"/bulletins/{item.slug}"


class EmergencyAlertDetailSitemap(CmsPageSitemap):
    def items(self):
        return EmergencyAlertDetail.objects.live()

    def location(self, item):
        return f"/emergency-alert-detail/{item.slug}"


class SubPageSitemap(FrontendSitemap):
    def items(self):
        parent_paths = {
            page.path: f"/{'advisories' if page.content_type.model == 'advisory' else 'bulletins'}/{page.slug}"
            for page in Page.objects.live()
            .filter(content_type__model__in=("advisory", "bulletin"))
            .select_related("content_type")
        }
        # (page, frontend path) pairs; subpages of other parents are skipped
        return [
            (page, f"{parent_paths[page.path[:-Page.steplen]]}/{page.slug}")
            for page in SubPage.objects.live()
            if page.path[:-Page.steplen] in parent_paths
        ]

    def location(self, item):
        return item[1]

    def lastmod(self, item):
        return item[0].last_published_at
