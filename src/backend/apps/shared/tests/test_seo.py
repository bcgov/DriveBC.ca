import datetime
import xml.etree.ElementTree as ElementTree

from apps.ferry.models import (
    CoastalFerryCalendar,
    CoastalFerryRoute,
    CoastalFerryStop,
    CoastalFerryStopTime,
    CoastalFerryTrip,
    Ferry,
)
from apps.rest.models import RestStop
from apps.shared.enums import Region
from apps.shared.models import Area
from apps.shared.tests import BaseTest
from apps.webcam.models import Webcam
from django.contrib.gis.geos import Point, Polygon


SITEMAP_NAMESPACE = {"sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class TestSeoViews(BaseTest):
    def setUp(self):
        super().setUp()

        self.rest_stop = RestStop.objects.create(
            rest_stop_id="rest-1",
            geometry={"type": "Point", "coordinates": [-123.1, 49.2]},
            properties={
                "REST_AREA_NAME": "Test Rest Stop",
                "DISTANCE_FROM_MUNICIPALITY": "5 km north of Testville",
            },
            bbox=[],
        )
        Ferry.objects.create(id=101, route_id=21, route_name="Test Lake Ferry")

        self.coastal_stop = CoastalFerryStop.objects.create(
            id=501,
            name="Test Coastal Terminal",
        )
        calendar = CoastalFerryCalendar.objects.create(
            id="seo-calendar",
            name="SEO test calendar",
            schedule_start=datetime.date(2026, 1, 1),
            schedule_end=datetime.date(2027, 1, 1),
            active_week_days="monday",
        )
        route = CoastalFerryRoute.objects.create(id=22, name="Test Coastal Route")
        trip = CoastalFerryTrip.objects.create(
            id="seo-trip",
            calendar=calendar,
            route=route,
        )
        CoastalFerryStopTime.objects.create(
            trip=trip,
            stop=self.coastal_stop,
            stop_time="08:00:00",
            stop_sequence=1,
        )

        area = Area.objects.create(
            id=99,
            name="Test Region",
            geometry=Polygon((
                (-124, 48),
                (-122, 48),
                (-122, 50),
                (-124, 50),
                (-124, 48),
            )),
        )
        self.public_camera = Webcam.objects.create(
            id=901,
            name="Test Highway Camera",
            region=Region.NORTHERN,
            region_name="Test Region",
            highway="1",
            highway_description="Test Highway",
            highway_group=1,
            highway_cam_order=1,
            location=Point(-123.1, 49.2),
            elevation=10,
            area=area,
            update_period_mean=60,
            update_period_stddev=10,
            is_on=False,
            should_appear=True,
        )
        self.hidden_camera = Webcam.objects.create(
            id=902,
            name="Hidden Camera",
            region=Region.NORTHERN,
            region_name="Test Region",
            highway="1",
            highway_description="Test Highway",
            highway_group=1,
            highway_cam_order=2,
            location=Point(-123.2, 49.2),
            elevation=10,
            area=area,
            update_period_mean=60,
            update_period_stddev=10,
            is_on=True,
            should_appear=False,
        )

    def test_detail_metadata_contains_titles_descriptions_and_canonicals(self):
        cases = (
            (f"/seo-metadata/cameras/{self.public_camera.pk}", "Test Highway Camera", "/cameras/901"),
            (
                f"/seo-metadata/rest-stops/{self.rest_stop.pk}",
                "Test Rest Stop",
                f"/rest-stops/{self.rest_stop.pk}",
            ),
            ("/seo-metadata/ferries/21", "Test Lake Ferry", "/ferries/21"),
            ("/seo-metadata/ferries/coastal/501", "Test Coastal Terminal", "/ferries/coastal/501"),
        )

        for url, expected_title, expected_path in cases:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200)
                self.assertContains(response, expected_title)
                self.assertContains(response, f"https://www.drivebc.ca{expected_path}")
                self.assertContains(response, 'name="description"')
                self.assertContains(response, 'property="og:title"')

    def test_legacy_detail_query_gets_preferred_canonical(self):
        response = self.client.get(
            "/seo-metadata/",
            {
                "type": "ferry",
                "id": self.coastal_stop.pk,
                "display_category": "coastalFerry",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "https://www.drivebc.ca/ferries/coastal/501")

    def test_sitemap_lists_public_camera_and_all_detail_types(self):
        response = self.client.get("/sitemap.xml")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/xml; charset=utf-8")
        root = ElementTree.fromstring(response.content)
        urls = {
            node.text
            for node in root.findall("sitemap:url/sitemap:loc", SITEMAP_NAMESPACE)
        }

        self.assertIn("https://www.drivebc.ca/cameras/901", urls)
        self.assertNotIn("https://www.drivebc.ca/cameras/902", urls)
        self.assertIn(f"https://www.drivebc.ca/rest-stops/{self.rest_stop.pk}", urls)
        self.assertIn("https://www.drivebc.ca/ferries/21", urls)
        self.assertIn("https://www.drivebc.ca/ferries/coastal/501", urls)
