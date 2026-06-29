import datetime
import json
import logging
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import patch

import pytest
from apps.feed.client import FeedClient
from apps.shared.tests import BaseTest, MockResponse
from apps.wildfire.enums import WILDFIRE_STATUS
from apps.wildfire.models import Wildfire
from apps.wildfire.serializers import WildfireAreaSerializer, WildfirePointSerializer
from apps.wildfire.tasks import populate_all_wildfire_data, populate_wildfire_from_data
from django.contrib.gis.geos import MultiPolygon, Point
from httpx import HTTPStatusError

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)

TEST_DATA_DIR = Path(__file__).parent / "test_data"


def wildfire_data_from_feature(feature):
    return {
        'location': feature['geometry'],
        **feature,
    }


class TestWildfireModel(BaseTest):
    def setUp(self):
        super().setUp()

        wildfire_area_feed_data = open(TEST_DATA_DIR / "wildfire_feed_area_list.json")
        self.mock_wildfire_area_feed_result = json.load(wildfire_area_feed_data)

        with open(TEST_DATA_DIR / "wildfire_feed_location_list.json") as wildfire_location_feed_data:
            self.mock_wildfire_location_feed_result = json.load(wildfire_location_feed_data)

        wildfire_updated_area_feed_data = open(TEST_DATA_DIR / "wildfire_feed_area_list_updated.json")
        self.mock_updated_wildfire_area_feed_result = json.load(wildfire_updated_area_feed_data)

        with open(TEST_DATA_DIR / "wildfire_feed_location_list_updated.json") as wildfire_updated_location_feed_data:
            self.mock_updated_wildfire_location_feed_result = json.load(wildfire_updated_location_feed_data)

        serializer = WildfirePointSerializer(data=self.mock_wildfire_location_feed_result)
        serializer.is_valid(raise_exception=True)
        self.parsed_features = serializer.validated_data['features']

        updated_serializer = WildfirePointSerializer(data=self.mock_updated_wildfire_location_feed_result)
        updated_serializer.is_valid(raise_exception=True)
        self.updated_parsed_features = updated_serializer.validated_data['features']

        area_serializer = WildfireAreaSerializer(data=self.mock_wildfire_area_feed_result)
        area_serializer.is_valid(raise_exception=True)
        self.areas_dict = {
            feature['id']: feature for feature in area_serializer.validated_data['features']
        }
        self.area_template = self.areas_dict['G70422']

    def feature_by_id(self, features, wildfire_id):
        return next(feature for feature in features if feature['id'] == wildfire_id)

    def combine_with_area(self, point_feature, area_id='G70422'):
        combined = wildfire_data_from_feature(point_feature)
        area_data = {
            key: value for key, value in self.areas_dict[area_id].items()
            if key != 'id'
        }
        combined.update(area_data)
        return combined

    def mock_area_list_for_incidents(self, incident_features):
        return {
            'features': [
                {**self.area_template, 'id': feature['id']}
                for feature in incident_features
            ]
        }

    def test_wildfire_point_serializer(self):
        assert len(self.parsed_features) == 7
        assert self.parsed_features[0]['id'] == 'G90400'
        assert self.parsed_features[0]['status'] == WILDFIRE_STATUS.HOLDING
        assert self.parsed_features[0]['reported_date'] == datetime.date(2026, 5, 22)
        assert self.parsed_features[3]['id'] == 'K70659'
        assert self.parsed_features[3]['status'] == WILDFIRE_STATUS.OUT_CNTRL
        assert self.feature_by_id(self.parsed_features, 'G90400')['wildfire_of_note'] is False
        assert self.feature_by_id(self.parsed_features, 'V10742')['wildfire_of_note'] is True
        assert 'size' not in self.parsed_features[0]
        assert 'url' not in self.parsed_features[0]

    def test_wildfire_of_note_separate_from_status(self):
        incident = next(
            i for i in self.mock_wildfire_location_feed_result['collection']
            if i['incidentNumberLabel'] == 'V10742'
        )
        assert incident['stageOfControlCode'] == 'OUT_CNTRL'
        assert incident['fireOfNoteInd'] is True

        fire_of_note_feature = self.feature_by_id(self.parsed_features, 'V10742')
        assert fire_of_note_feature['status'] == WILDFIRE_STATUS.OUT_CNTRL
        assert fire_of_note_feature['wildfire_of_note'] is True
        assert isinstance(fire_of_note_feature['wildfire_of_note'], bool)
        assert fire_of_note_feature['wildfire_of_note'] not in WILDFIRE_STATUS

        out_of_control_feature = self.feature_by_id(self.parsed_features, 'K70659')
        assert out_of_control_feature['status'] == WILDFIRE_STATUS.OUT_CNTRL
        assert out_of_control_feature['wildfire_of_note'] is False

        populate_wildfire_from_data(self.combine_with_area(fire_of_note_feature))
        wildfire = Wildfire.objects.get(id='V10742')
        assert wildfire.status == WILDFIRE_STATUS.OUT_CNTRL
        assert wildfire.wildfire_of_note is True

        populate_wildfire_from_data(self.combine_with_area(out_of_control_feature))
        wildfire = Wildfire.objects.get(id='K70659')
        assert wildfire.status == WILDFIRE_STATUS.OUT_CNTRL
        assert wildfire.wildfire_of_note is False

    def test_populate_wildfire_function(self):
        holding_feature = self.feature_by_id(self.parsed_features, 'G90400')
        out_of_control_feature = self.feature_by_id(self.parsed_features, 'K70659')
        area_data = self.areas_dict['G70422']

        # Under Control, not populated
        under_control_data = {
            **self.combine_with_area(holding_feature),
            'status': WILDFIRE_STATUS.UNDR_CNTRL,
        }
        assert populate_wildfire_from_data(under_control_data) is not None
        assert Wildfire.objects.filter(id='G90400').exists()

        # Out, not populated
        out_data = {
            **self.combine_with_area(holding_feature),
            'status': WILDFIRE_STATUS.OUT,
        }
        populate_wildfire_from_data(out_data)
        assert Wildfire.objects.filter(id='G90400').exists()

        # Being Held
        populate_wildfire_from_data(self.combine_with_area(holding_feature))
        wildfire = Wildfire.objects.get(id='G90400')
        assert wildfire.url == area_data['url']
        assert wildfire.name == 'G90400'
        assert isinstance(wildfire.location, Point)
        assert isinstance(wildfire.geometry, MultiPolygon)
        assert wildfire.size == area_data['size']
        assert wildfire.status == WILDFIRE_STATUS.HOLDING
        assert wildfire.reported_date == datetime.date(2026, 5, 22)
        assert wildfire.wildfire_of_note is False

        # Out of Control
        populate_wildfire_from_data(self.combine_with_area(out_of_control_feature))
        wildfire = Wildfire.objects.get(id='K70659')
        assert wildfire.name == 'Riley Creek'
        assert isinstance(wildfire.location, Point)
        assert isinstance(wildfire.geometry, MultiPolygon)
        assert wildfire.status == WILDFIRE_STATUS.OUT_CNTRL
        assert wildfire.wildfire_of_note is False

        # Fire of note
        fire_of_note_feature = self.feature_by_id(self.parsed_features, 'V10742')
        populate_wildfire_from_data(self.combine_with_area(fire_of_note_feature))
        wildfire = Wildfire.objects.get(id='V10742')
        assert wildfire.wildfire_of_note is True

        # Blank status
        blank_status_data = {
            **self.combine_with_area(out_of_control_feature),
            'status': '',
        }
        populate_wildfire_from_data(blank_status_data)
        wildfire = Wildfire.objects.get(id='K70659')
        assert wildfire.status == ''

    @patch.object(FeedClient, 'get_wildfire_area_list')
    @patch("httpx.get")
    def test_populate_and_update_wildfires(self, mock_requests_get, mock_get_wildfire_area_list):
        mock_get_wildfire_area_list.side_effect = [
            self.mock_area_list_for_incidents(self.parsed_features),
            self.mock_area_list_for_incidents(self.updated_parsed_features),
        ]
        mock_requests_get.side_effect = [
            MockResponse(self.mock_wildfire_location_feed_result, status_code=200),
            MockResponse(self.mock_updated_wildfire_location_feed_result, status_code=200),
        ]

        populate_all_wildfire_data()

        assert Wildfire.objects.count() == 7
        wildfire = Wildfire.objects.get(id='G90400')
        assert wildfire.reported_date == datetime.date(2026, 5, 22)
        assert isinstance(wildfire.location, Point)
        assert isinstance(wildfire.geometry, MultiPolygon)
        assert wildfire.size == self.area_template['size']
        assert wildfire.url == self.area_template['url']
        assert Wildfire.objects.get(id='K70659').status == WILDFIRE_STATUS.OUT_CNTRL

        populate_all_wildfire_data()

        assert Wildfire.objects.count() == 5
        assert not Wildfire.objects.filter(id='K70748').exists()
        assert not Wildfire.objects.filter(id='K70659').exists()
        assert Wildfire.objects.filter(id='G90400').exists()

    @patch("httpx.get")
    def test_wildfire_feed_client_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse({}, status_code=INTERNAL_SERVER_ERROR),
            MockResponse(self.mock_wildfire_location_feed_result, status_code=200),
        ]

        with pytest.raises(HTTPStatusError):
            populate_all_wildfire_data()

        assert Wildfire.objects.count() == 0
