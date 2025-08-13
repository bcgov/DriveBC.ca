from apps.ferry.models import Ferry
from apps.ferry.serializers import FerryRouteSerializer
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import Point


class TestFerrySerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.ferry = Ferry(
            # General
            id=1,
            name="Adam",
            route_id=1,
            route_name="Adam's Lake Cable Ferry",
            route_description="The Adams Lake ferry runs across Adams Lake, "
                              "20km north of Highway 1 between Chase and Sorrento. "
                              "The ferry is located approximately 80km northeast of "
                              "Kamloops and 50km northwest of Salmon Arm.",

            # Urls
            url="https://www2.gov.bc.ca/gov/content/transportation/"
                "passenger-travel/water-travel/inland-ferries/adams-"
                "lake-cable-ferry",
            image_url="https://www2.gov.bc.ca/assets/gov/driving-and-"
                      "transportation/passenger/inland-ferries/photos/adamslakeii.jpg",
            route_image_url="https://www2.gov.bc.ca/assets/gov/driving-and-"
                            "transportation/passenger/inland-ferries/maps/adamslakecableferry_map.jpg",

            # Location
            location=Point(1443586.90943286, 680099.30986824),

            # Capacity
            vehicle_capacity=10,
            passenger_capacity=48,
            crossing_time_min=6,
            weight_capacity_kg=34000,

            # Schedule
            schedule_type="On Demand 24hr With Gaps",
            schedule_detail="<p><strong>Service hours</strong>:</p> <p>On demand, "
            "24-hours</p> <ul> <li>5 am - 3 am</li> <li>3 am - 5 am "
            "(emergency only)</li> </ul>",
            special_restriction="",

            # Contacts
            contact_org="WaterBridge Ferries Inc.",
            contact_phone="2502652105",
            contact_alt_phone="",
            contact_fax="2502652192",

            # Webcams
            webcam_url_1="https://images.drivebc.ca/bchighwaycams/cameras/1102.jpg",
            webcam_url_2="https://images.drivebc.ca/bchighwaycams/cameras/1095.jpg",
            webcam_url_3="https://images.drivebc.ca/bchighwaycams/cameras/1094.jpg",
            webcam_url_4="",
            webcam_url_5="",
        )

        self.ferry.save()

        # Change ID to create second ferry with the same route ID
        self.ferry.id = 2
        self.ferry.name = "Eve"
        self.ferry.schedule_detail = "<p><strong>Service hours</strong>:</p> <p>Every hour, 7am-7pm</p>"
        self.ferry.schedule_type = "Summer Schedule"
        self.ferry.vehicle_capacity = 20
        self.ferry.passenger_capacity = 200
        self.ferry.weight_capacity_kg = 60000
        self.ferry.save()

        self.serializer = FerryRouteSerializer(self.ferry)

    def test_serializer_data(self):
        # 2025/07/24 added ferry type
        assert len(self.serializer.data) == 22  # vessel field + 21 non-vessel fields
        assert self.serializer.data["route_name"] == "Adam\'s Lake Cable Ferry"
        assert self.serializer.data["contact_phone"] == "2502652105"  # number in string
        assert self.serializer.data["webcam_url_3"] == "https://images.drivebc.ca/bchighwaycams/cameras/1094.jpg"
        assert self.serializer.data["webcam_url_4"] == ""  # Empty webcam url

        # Vessels
        assert len(self.serializer.data["vessels"]) == 2

        assert self.serializer.data["vessels"][0]["name"] == "Adam"
        assert self.serializer.data["vessels"][0]["vehicle_capacity"] == 10
        assert self.serializer.data["vessels"][0]["passenger_capacity"] == 48
        assert self.serializer.data["vessels"][0]["crossing_time_min"] == 6
        assert self.serializer.data["vessels"][0]["weight_capacity_kg"] == 34000
        assert self.serializer.data["vessels"][0]["schedule_type"] == "On Demand 24hr With Gaps"
        assert (self.serializer.data["vessels"][0]["schedule_detail"] ==
                "<p><strong>Service hours</strong>:</p> <p>On demand, "
                "24-hours</p> <ul> <li>5 am - 3 am</li> <li>3 am - 5 "
                "am (emergency only)</li> </ul>")

        assert self.serializer.data["vessels"][1]["name"] == "Eve"
        assert self.serializer.data["vessels"][1]["vehicle_capacity"] == 20
        assert self.serializer.data["vessels"][1]["passenger_capacity"] == 200
        assert self.serializer.data["vessels"][1]["crossing_time_min"] == 6
        assert self.serializer.data["vessels"][1]["weight_capacity_kg"] == 60000
        assert self.serializer.data["vessels"][1]["schedule_type"] == "Summer Schedule"
        assert (self.serializer.data["vessels"][1]["schedule_detail"] ==
                "<p><strong>Service hours</strong>:</p> <p>Every hour, "
                "7am-7pm</p>")
