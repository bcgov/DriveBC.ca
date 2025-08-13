import csv
import logging
from pathlib import Path

from apps.ferry.models import (
    CoastalFerryCalendar,
    CoastalFerryRoute,
    CoastalFerryStop,
    CoastalFerryStopTime,
    CoastalFerryTrip,
)
from apps.ferry.tasks import populate_coastal_ferry_data
from apps.shared.tests import BaseTest

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)


class TestCoastalFerryTask(BaseTest):
    def setUp(self):
        super().setUp()

        # Create a dictionary to store CSV data
        self.csv_data = {}

        # Get the path to the test_data/coastal directory
        coastal_dir = Path(__file__).parent / 'test_data' / 'coastal'

        # Read all CSV files in the directory
        if coastal_dir.exists():
            for file_path in coastal_dir.glob('*.txt'):
                filename = file_path.name
                with open(file_path, newline='', encoding='utf-8') as csvfile:
                    reader = csv.DictReader(csvfile)
                    self.csv_data[filename] = list(reader)

    def test_populate_coastal_ferry_function(self):
        populate_coastal_ferry_data(self.csv_data)

        # Check if the data was populated correctly
        assert CoastalFerryRoute.objects.all().count() == 1
        assert CoastalFerryStop.objects.all().count() == 6
        assert CoastalFerryTrip.objects.all().count() == 4
        assert CoastalFerryStopTime.objects.all().count() == 8
        assert CoastalFerryCalendar.objects.all().count() == 1
