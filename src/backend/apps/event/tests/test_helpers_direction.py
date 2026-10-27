from apps.event.enums import EVENT_DIRECTION
from apps.event.helpers import parse_direction_from_text
from django.test import SimpleTestCase


class ParseDirectionFromTextTest(SimpleTestCase):
    def test_cardinal_directions(self):
        assert parse_direction_from_text('Hwy 1, Eastbound, Hope') == EVENT_DIRECTION.EAST
        assert parse_direction_from_text('Hwy 20, Westbound, Heckman Pass') == EVENT_DIRECTION.WEST
        assert parse_direction_from_text('Hwy 37S, Northbound, Terrace') == EVENT_DIRECTION.NORTH
        assert parse_direction_from_text('Hwy 97C, Southbound, West Kelowna') == EVENT_DIRECTION.SOUTH

    def test_both_directions(self):
        assert parse_direction_from_text(
            'Hwy 3, Both Directions, 36km east of Hwy 5 Junction'
        ) == EVENT_DIRECTION.BOTH
        assert parse_direction_from_text(
            'Road closed in both directions near Princeton'
        ) == EVENT_DIRECTION.BOTH

    def test_case_insensitive(self):
        assert parse_direction_from_text('highway 1, EASTBOUND, yale') == EVENT_DIRECTION.EAST
        assert parse_direction_from_text('HIGHWAY 3, westbound, pass') == EVENT_DIRECTION.WEST

    def test_none_when_missing_or_empty(self):
        assert parse_direction_from_text() == EVENT_DIRECTION.NONE
        assert parse_direction_from_text('') == EVENT_DIRECTION.NONE
        assert parse_direction_from_text(None) == EVENT_DIRECTION.NONE
        assert parse_direction_from_text('Highway 20 between A and B') == EVENT_DIRECTION.NONE

    def test_uses_first_matching_text(self):
        assert parse_direction_from_text(
            '',
            None,
            'Hwy 5, Southbound, Helmer',
        ) == EVENT_DIRECTION.SOUTH

    def test_both_directions_checked_before_cardinals(self):
        # Would also contain "east" in surrounding text; phrase match should still be BOTH
        assert parse_direction_from_text(
            'Hwy 3, Both Directions, 36km east of Hwy 5 Junction'
        ) == EVENT_DIRECTION.BOTH
