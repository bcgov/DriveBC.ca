from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch
from xml.etree import ElementTree

import pytest
from apps.cms.models import Advisory, Bulletin, BulletinIndexPage, SubPage
from apps.cms.sitemaps import (
    AdvisorySitemap,
    BulletinSitemap,
    CameraSitemap,
    FerrySitemap,
    RestStopSitemap,
    StaticPageSitemap,
    SubPageSitemap,
    WeatherSitemap,
)
from apps.ferry.models import Ferry
from apps.rest.models import RestStop
from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from django.contrib.gis.geos import Point
from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase, override_settings
from django.utils import timezone
from wagtail.images.models import Image
from wagtail.models import Page


def get_locations(response):
    namespace = {"sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return {node.text for node in ElementTree.fromstring(response.content).findall("sitemap:url/sitemap:loc", namespace)}


class SitemapTests(TestCase):
    @override_settings(FRONTEND_BASE_URL="https://www.drivebc.ca/")
    def test_sitemap_endpoint_contains_frontend_urls(self):
        with (
            patch.object(CameraSitemap, "items", return_value=["/cameras/123"]),
            patch.object(FerrySitemap, "items", return_value=["/ferry/123", "/coastal-ferry/124"]),
            patch.object(RestStopSitemap, "items", return_value=["/rest-stop/456"]),
            patch.object(WeatherSitemap, "items", return_value=["/regional-weather/789"]),
        ):
            response = self.client.get("/sitemap.xml")

        assert response.status_code == 200
        assert response["Content-Type"] == "application/xml"
        assert response["X-Robots-Tag"] == "noindex, noodp, noarchive"

        locations = get_locations(response)
        for path in [
            "/",
            "/cameras",
            "/cameras/123",
            "/ferry/123",
            "/coastal-ferry/124",
            "/rest-stop/456",
            "/regional-weather/789",
            "/advisories",
            "/feedback",
            "/highway-problem",
            "/road-electrical-problem",
        ]:
            assert f"https://www.drivebc.ca{path}" in locations
        assert "https://www.drivebc.ca/account" not in locations

    def test_camera_sitemap_only_uses_publicly_listed_cameras(self):
        with patch("apps.cms.sitemaps.Webcam.objects.filter") as cameras:
            cameras.return_value.order_by.return_value.values_list.return_value = [456]
            assert CameraSitemap().items() == ["/cameras/456"]

        cameras.assert_called_once_with(should_appear=True)

    def test_map_feature_sitemaps_use_frontend_paths(self):
        Ferry.objects.create(id=1, route_id=41)
        Ferry.objects.create(id=2, route_id=41)
        rest_stop = RestStop.objects.create(geometry={"type": "Point", "coordinates": [-121, 49]})
        roadside = CurrentWeather.objects.create(code="RW1", weather_station_name="Hope")
        CurrentWeather.objects.create(weather_station_name="No code")
        regional = RegionalWeather.objects.create(code="s0000001", location_latitude="49N", location_longitude="121W")
        HighElevationForecast.objects.create(code="HEF1", issued_utc=timezone.now(), location=Point(-121, 49))
        HighElevationForecast.objects.create(
            code="HEF2", issued_utc=timezone.now() - timedelta(days=2), location=Point(-121, 49)
        )

        assert FerrySitemap().items() == ["/ferry/41"]
        assert RestStopSitemap().items() == [f"/rest-stop/{rest_stop.pk}"]
        assert WeatherSitemap().items() == [
            f"/roadside-weather/{roadside.pk}",
            f"/regional-weather/{regional.pk}",
            "/high-elevation-weather/HEF1",
        ]

    def test_advisory_sitemap_uses_live_pages(self):
        published = SimpleNamespace(slug="published-advisory")
        manager = Advisory.objects
        with patch.object(manager, "live", return_value=[published]) as live_pages:
            items = AdvisorySitemap().items()

        assert items == [published]
        live_pages.assert_called_once_with()

    @override_settings(FRONTEND_BASE_URL="https://www.drivebc.ca/")
    def test_only_published_cms_content_is_included(self):
        root = Page.get_first_root_node()
        index = root.add_child(
            instance=BulletinIndexPage(title="Bulletins", slug="bulletins")
        )
        image = Image(
            title="Sitemap test image",
            file="sitemap-test.png",
            width=1,
            height=1,
        )
        image.save()
        published = index.add_child(
            instance=Bulletin(
                title="Published",
                slug="published",
                body=[],
                image=image,
                image_alt_text="Test image",
            )
        )
        published.save_revision().publish()
        index.add_child(
            instance=Bulletin(
                title="Draft",
                slug="draft",
                body=[],
                image=image,
                image_alt_text="Test image",
                live=False,
            )
        )

        subpage = published.add_child(
            instance=SubPage(title="Details", slug="details", body=[])
        )
        subpage.save_revision().publish()
        published.add_child(
            instance=SubPage(
                title="Draft details",
                slug="draft-details",
                body=[],
                live=False,
            )
        )

        assert [page.slug for page in BulletinSitemap().items()] == ["published"]
        assert [SubPageSitemap().location(item) for item in SubPageSitemap().items()] == ["/bulletins/published/details"]

        locations = get_locations(self.client.get("/sitemap.xml"))
        assert "https://www.drivebc.ca/bulletins/published" in locations
        assert "https://www.drivebc.ca/bulletins/published/details" in locations
        assert "https://www.drivebc.ca/bulletins/draft" not in locations
        assert "https://www.drivebc.ca/bulletins/published/draft-details" not in locations

    @override_settings(FRONTEND_BASE_URL="https://www.drivebc.ca/")
    def test_frontend_domain_is_used_instead_of_request_host(self):
        assert StaticPageSitemap().get_domain() == "www.drivebc.ca"
        assert StaticPageSitemap().get_protocol() == "https"

    @override_settings(FRONTEND_BASE_URL="www.drivebc.ca")
    def test_invalid_frontend_url_fails_explicitly(self):
        with pytest.raises(ImproperlyConfigured):
            StaticPageSitemap().get_urls()
