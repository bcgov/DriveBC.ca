from apps.event.helpers import build_event_site_link, get_pan_zoom_for_geometry
from django.contrib.gis.geos import LineString, MultiLineString, Point, Polygon
from django.test import SimpleTestCase, override_settings


class FakeEvent:
    id = 'EVT-1'
    display_category = 'closures'


class FakeRoute:
    start = 'A'
    end = 'B'
    start_point = Point(0, 0)
    end_point = Point(1, 1)
    distance = 12.3
    route = MultiLineString(LineString((0, 0), (1, 1)))


class GetPanZoomForGeometryTest(SimpleTestCase):
    def test_returns_extent_center_and_zoom(self):
        geom = Polygon.from_bbox((-120, 49, -118, 51))
        pan_lon, pan_lat, zoom = get_pan_zoom_for_geometry(geom)
        assert pan_lon == -119.0
        assert pan_lat == 50.0
        assert zoom >= 5
        assert zoom <= 15

    def test_empty_geometry_returns_none(self):
        assert get_pan_zoom_for_geometry(None) is None
        assert get_pan_zoom_for_geometry(Polygon()) is None


class BuildEventSiteLinkTest(SimpleTestCase):
    @override_settings(FRONTEND_BASE_URL='https://example.drivebc.ca/')
    def test_area_link_includes_pan_zoom_from_geometry(self):
        link = build_event_site_link(
            FakeEvent(), geometry=Polygon.from_bbox((0, 0, 1, 1))
        )
        assert 'type=event&display_category=closures&id=EVT-1' in link
        assert 'pan=0.5,0.5' in link
        assert 'zoom=' in link
        assert 'route_distance=' not in link

    @override_settings(FRONTEND_BASE_URL='https://example.drivebc.ca/')
    def test_route_link_includes_route_params_and_pan_zoom(self):
        link = build_event_site_link(FakeEvent(), route=FakeRoute())
        assert 'type=event&display_category=closures&id=EVT-1' in link
        assert 'route_distance=12.3' in link
        assert 'pan=0.5,0.5' in link
        assert 'zoom=' in link
