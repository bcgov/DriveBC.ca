import datetime
import json
import os
import zoneinfo

from apps.feed.serializers import WebcamAPISerializer
from apps.shared.tests import BaseTest


class TestWebcamFeedSerializer(BaseTest):
    def setUp(self):
        data_path = os.path.join(os.getcwd(), "apps/feed/tests/test_data/webcam_feed_single_set.json")
        with open(data_path) as f:
            self.webcam_data = json.load(f)

    def test_webcam_to_internal_value(self):
        webcam_serializer = WebcamAPISerializer(data=self.webcam_data)
        webcam_serializer.is_valid(raise_exception=True)

        webcams_list = webcam_serializer.validated_data
        self.assertEqual(len(webcams_list["webcams"]), 1)

        webcam_data = webcams_list["webcams"][0]
        self.assertEqual(webcam_data["id"], 8)
        self.assertEqual(webcam_data["isOn"], True)
        self.assertEqual(webcam_data["shouldAppear"], True)
        self.assertEqual(webcam_data["region"]['group'], 3)
        self.assertEqual(webcam_data["region"]['name'], 'Vancouver Island')
        self.assertEqual(webcam_data["regionGroup"]['highwayGroup'], 0)
        self.assertEqual(webcam_data["regionGroup"]['highwayCamOrder'], 29)
        self.assertEqual(webcam_data["highway"]['number'], '1')
        self.assertEqual(webcam_data["highway"]['locationDescription'], 'Vancouver Island')
        self.assertEqual(webcam_data["camName"], 'Malahat Drive - N')
        self.assertEqual(webcam_data["caption"], 'Hwy 1 at South Shawnigan Lake Road, looking north.')
        self.assertEqual(webcam_data["orientation"], 'N')
        self.assertEqual(webcam_data["location"]['latitude'], 48.561231)
        self.assertEqual(webcam_data["location"]['longitude'], -123.569743)
        self.assertEqual(webcam_data["location"]['elevation'], 327)
        self.assertEqual(webcam_data["isNew"], False)
        self.assertEqual(webcam_data["isOnDemand"], False)
        self.assertEqual(webcam_data["imageStats"]['lastAttempt']['time'], datetime.datetime(2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(webcam_data["imageStats"]['lastModified']['time'], datetime.datetime(2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(webcam_data["imageStats"]["markedStale"], False)
        self.assertEqual(webcam_data["imageStats"]["markedDelayed"], False)
        self.assertEqual(webcam_data["imageStats"]["updatePeriodMean"], 692)
        self.assertEqual(webcam_data["imageStats"]["updatePeriodStdDev"], 65)
