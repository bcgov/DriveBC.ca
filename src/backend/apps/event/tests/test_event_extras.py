from apps.event.enums import EVENT_DISPLAY_CATEGORY
from apps.event.models import Event
from apps.event.templatetags.event_extras import (
    event_label,
    event_theme,
    event_title,
    item_icon,
    location_blocks,
    location_extent,
)
from django.contrib.gis.geos import LineString
from django.test import SimpleTestCase


class EventExtrasTest(SimpleTestCase):
    def test_future_closure_label_and_theme(self):
        event = Event(display_category=EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS, severity='MAJOR', closed=True)
        assert event_label(event) == 'future closure'
        assert event_theme(event)['color'] == '#B73433'

    def test_location_blocks_strip_labels_and_add_landmark(self):
        description = 'Starts: <br>30 km South of Quesnel<br><br>Ends: <br>12 km Southwest of Kamloops'
        assert location_blocks(description, 'Lhtako Dene') == [
            ['30 km South of Quesnel', 'Lhtako Dene'],
            ['12 km Southwest of Kamloops'],
        ]

    def test_location_blocks_skip_duplicate_landmark(self):
        assert location_blocks('Starts: <br>30 km South of Quesnel', '30 km South of Quesnel') == \
            [['30 km South of Quesnel']]
        assert location_blocks('', 'Quesnel') == [['Quesnel']]

    def test_item_icon(self):
        assert item_icon('Estimated 20 minute delay', 'impacts') == 'impact-clock'
        assert item_icon('Right lane closed', 'impacts') == 'impact-do-not-enter'
        assert item_icon('Blasting', 'impacts') == 'impact-exclamation-circle'
        assert item_icon('Speed limit reduced', 'restrictions') == 'restriction-triangle'
        assert item_icon('Until further notice', 'in_effect') == ''

    def test_event_title(self):
        event = Event(route_at='Highway 97, Okanagan Highway', direction='N')
        assert event_title(event) == {'title': 'Northbound on Highway 97', 'subtitle': 'Okanagan Highway'}

        event = Event(route_at='Highway 97', direction='NONE')
        assert event_title(event) == {'title': 'Highway 97', 'subtitle': ''}

    def test_location_extent(self):
        line = LineString((-120.79, 50.17), (-120.79, 50.46), srid=4326)  # ~32 km north-south
        event = Event(
            location=line,
            location_description='Starts: <br>8 km North of Merritt<br>94.6 km Southwest of Kamloops'
                                 '<br><br>Ends: <br>19 km South of Merritt',
        )
        event.previous = Event(location_description='Starts: <br>8 km North of Merritt<br>94.6 km Southwest of Kamloops'
                                                    '<br><br>Ends: <br>18.9 km South of Merritt')

        extent = location_extent(event)

        assert extent['length'] == '32'
        assert extent['sides'] == [
            {'label': 'Starts', 'lines': ['8 km North of Merritt', '94.6 km Southwest of Kamloops'],
             'previous': None, 'changed': False},
            {'label': 'Ends', 'lines': ['19 km South of Merritt'],
             'previous': ['18.9 km South of Merritt'], 'changed': True},
        ]

    def test_location_extent_none_for_point(self):
        assert location_extent(Event(location_description='Starts: <br>8 km North of Merritt')) is None
