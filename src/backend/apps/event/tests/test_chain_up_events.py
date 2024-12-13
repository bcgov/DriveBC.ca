from datetime import datetime
import json
import logging
from pathlib import Path
import zoneinfo

from ..serializers import CarsEventSerializer


from apps.shared.tests import BaseTest, MockResponse

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.ERROR)


class TestChainUpEvents(BaseTest):
    def setUp(self):
        super().setUp()

        data_dir = str(Path(__file__).parent) + "/test_data/"

        with open(data_dir + 'cars_feed_list_of_chain_ups.json', 'r') as file:
            self.mock_cars_data = json.load(file)

    def test_serializer(self):
        serializer = CarsEventSerializer(data=self.mock_cars_data[0])
        serializer.is_valid()

        # test values that have some logic in serializing them, not just copying
        assert serializer.validated_data['id'] == 'DBCCNUP-127431'
        assert serializer.validated_data['location_description'] == 'Between Rainbow Range Trailhead and Elsey Rd'
        assert serializer.validated_data['description'] == 'Highway 20. Commercial chain up in effect between Rainbow Range Trailhead and Elsey Rd for 0.1 km (35 km west of Anahim Lake).'
        tz = zoneinfo.ZoneInfo("America/Vancouver")
        last_updated = datetime(2024, 10, 16, 13, 17, 28, tzinfo=tz)
        assert serializer.validated_data['last_updated'] == last_updated

