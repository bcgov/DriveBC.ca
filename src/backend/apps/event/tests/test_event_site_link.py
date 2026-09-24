from apps.event.helpers import build_event_site_link, get_pan_zoom_for_geometry
from django.contrib.gis.geos import LineString, MultiLineString, Point, Polygon
from django.test import SimpleTestCase, override_settings


class FakeEvent:
    id = 'EVT-1'
    display_category = 'closures'
    location = Point(-120.5, 50.25)


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
    def test_area_link_matches_view_on_map(self):
        link = build_event_site_link(FakeEvent())
        assert link == (
            'https://example.drivebc.ca/?type=event'
            '&display_category=closures&id=EVT-1'
            '&pan=-120.5,50.25&zoom=11'
        )
        assert 'route_distance=' not in link

    @override_settings(FRONTEND_BASE_URL='https://example.drivebc.ca/')
    def test_area_linestring_uses_centroid(self):
        event = FakeEvent()
        event.location = LineString((-120, 50), (-118, 52))
        link = build_event_site_link(event)
        assert 'zoom=11' in link
        assert 'route_distance=' not in link
        assert 'pan=-119.' in link

    @override_settings(FRONTEND_BASE_URL='https://example.drivebc.ca/')
    def test_route_link_includes_route_params_and_pan_zoom(self):
        link = build_event_site_link(FakeEvent(), route=FakeRoute())
        assert 'type=event&display_category=closures&id=EVT-1' in link
        assert 'route_distance=12.3' in link
        assert 'route_start=A' in link
        assert 'pan=0.5,0.5' in link
        assert 'zoom=' in link
        # Event location / fixed zoom=11 is not used for route links
        assert 'pan=-120.5,50.25' not in link
        assert '&zoom=11' not in link
