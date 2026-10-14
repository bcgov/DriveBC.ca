from types import SimpleNamespace
from unittest.mock import patch
from xml.etree import ElementTree

from apps.cms.models import (
    Advisory,
    Bulletin,
    BulletinIndexPage,
    SubPage,
)
from apps.cms.sitemaps import (
    AdvisorySitemap,
    BulletinSitemap,
    CameraSitemap,
    StaticPageSitemap,
    SubPageSitemap,
    FerrySitemap,
    RestStopSitemap,
    WeatherSitemap,
)
from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase, override_settings
from wagtail.images.models import Image
from wagtail.models import Page


class SitemapTests(TestCase):
    @override_settings(FRONTEND_BASE_URL="https://www.drivebc.ca/")
    @patch.object(
        CameraSitemap,
        "items",
        return_value=[SimpleNamespace(pk=123)],
    )
    def test_sitemap_endpoint_contains_canonical_public_urls(self, _mock_camera_items):
        with (
            patch.object(
                FerrySitemap,
                "items",
                return_value=[("ferry", 123, False), ("ferry", 124, True)],
            ),
            patch.object(
                RestStopSitemap,
                "items",
                return_value=[("restStop", 456)],
            ),
            patch.object(
                WeatherSitemap,
                "items",
                return_value=[("regionalWeather", 789)],
            ),
        ):
            response = self.client.get("/sitemap.xml")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/xml")
        self.assertEqual(response["X-Robots-Tag"], "noindex, noodp, noarchive")

        namespace = {"sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locations = {
            node.text
            for node in ElementTree.fromstring(response.content).findall(
                "sitemap:url/sitemap:loc", namespace
            )
        }
        self.assertIn("https://www.drivebc.ca/", locations)
        self.assertIn("https://www.drivebc.ca/cameras", locations)
        self.assertIn("https://www.drivebc.ca/cameras/123", locations)
        self.assertIn("https://www.drivebc.ca/ferry/123", locations)
        self.assertIn(
            "https://www.drivebc.ca/coastal-ferry/124",
            locations,
        )
        self.assertIn("https://www.drivebc.ca/rest-stop/456", locations)
        self.assertIn(
            "https://www.drivebc.ca/regional-weather/789",
            locations,
        )
        self.assertIn("https://www.drivebc.ca/advisories", locations)
        self.assertNotIn("https://www.drivebc.ca/account", locations)

    def test_camera_sitemap_only_uses_publicly_listed_cameras(self):
        camera = SimpleNamespace(pk=456)
        manager = CameraSitemap()
        with (
            patch("apps.cms.sitemaps.Webcam.objects.filter") as cameras,
        ):
            cameras.return_value.order_by.return_value = [camera]
            self.assertEqual(manager.items(), [camera])

        cameras.assert_called_once_with(should_appear=True)
        cameras.return_value.order_by.assert_called_once_with("pk")
        self.assertEqual(manager.location(camera), "/cameras/456")

    def test_ferry_sitemap_distinguishes_coastal_and_inland_routes(self):
        sitemap = FerrySitemap()

        self.assertEqual(
            sitemap.location(("ferry", 123, False)),
            "/ferry/123",
        )
        self.assertEqual(
            sitemap.location(("ferry", 123, True)),
            "/coastal-ferry/123",
        )

    def test_rest_stop_sitemap_uses_clean_canonical_url(self):
        self.assertEqual(
            RestStopSitemap().location(("restStop", 456)),
            "/rest-stop/456",
        )

    def test_weather_sitemap_uses_distinct_clean_urls(self):
        sitemap = WeatherSitemap()
        self.assertEqual(
            sitemap.location(("localWeather", 789)),
            "/roadside-weather/789",
        )
        self.assertEqual(
            sitemap.location(("regionalWeather", 790)),
            "/regional-weather/790",
        )
        self.assertEqual(sitemap.location(("hef", 791)), "/high-elevation-weather/791")

    def test_advisory_sitemap_uses_live_pages(self):
        published = SimpleNamespace(slug="published-advisory")
        manager = Advisory.objects
        with patch.object(manager, "live", return_value=[published]) as live_pages:
            items = AdvisorySitemap().items()

        self.assertEqual(items, [published])
        live_pages.assert_called_once_with()

    def test_subpage_location_uses_frontend_parent_route(self):
        page = SimpleNamespace(slug="details")
        sitemap = SubPageSitemap()

        self.assertEqual(
            sitemap.location((page, "advisories", "road-closure")),
            "/advisories/road-closure/details",
        )

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

        self.assertEqual(
            [page.slug for page in BulletinSitemap().items()],
            ["published"],
        )
        self.assertEqual(
            [
                SubPageSitemap().location(item)
                for item in SubPageSitemap().items()
            ],
            ["/bulletins/published/details"],
        )

        response = self.client.get("/sitemap.xml")
        namespace = {"sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locations = {
            node.text
            for node in ElementTree.fromstring(response.content).findall(
                "sitemap:url/sitemap:loc", namespace
            )
        }
        self.assertIn("https://www.drivebc.ca/bulletins/published", locations)
        self.assertIn(
            "https://www.drivebc.ca/bulletins/published/details",
            locations,
        )
        self.assertNotIn("https://www.drivebc.ca/bulletins/draft", locations)
        self.assertNotIn(
            "https://www.drivebc.ca/bulletins/published/draft-details",
            locations,
        )

    @override_settings(FRONTEND_BASE_URL="https://www.drivebc.ca/")
    def test_frontend_domain_is_used_instead_of_request_host(self):
        self.assertEqual(StaticPageSitemap().get_domain(), "www.drivebc.ca")
        self.assertEqual(StaticPageSitemap().get_protocol(), "https")

    @override_settings(FRONTEND_BASE_URL="www.drivebc.ca")
    def test_invalid_frontend_url_fails_explicitly(self):
        with self.assertRaises(ImproperlyConfigured):
            StaticPageSitemap().get_urls()
