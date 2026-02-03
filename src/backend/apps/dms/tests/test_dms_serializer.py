from apps.shared.tests import BaseTest
from apps.dms.models import Dms
from apps.dms.serializers import DmsSerializer
from django.contrib.gis.geos import Point


class TestDmsSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.dms = Dms(
            name="DMS10",
            category="ADDCO 2x20 LM-2 FRATIS",
            description="Hwy 17 WB at 136 St.",
            roadway_name="Highway 17",
            roadway_direction="Westbound",
            static_text="",
            message_text="[pt30o0][fo3][jl2]PATTULLO BR[jl4]<5 MIN[nl][jl2]PORT MANN BR[jl4]<5 MIN[np][pt30o0][fo3][jl2]ALEX FRASER BR[jl4]<5 MIN[nl][jl2]MASSEY TUNNEL[jl4]<5 MIN",
            status="OK",
            location=Point(-124.64, 58.66),
        )

        self.dms_2 = Dms(
            name="DMS11",
            category="ADDCO 2x20 LM-2 FRATIS",
            description="Hwy 17 WB at 136 St.",
            roadway_name="Highway 17",
            roadway_direction="Eastbound",
            static_text="",
            message_text="[pt30o0][fo3][jl2]PATTULLO BR[jl4]<5 MIN[nl][jl2]PORT MANN BR[jl4]<5 MIN[np][pt30o0][fo3][jl2]ALEX FRASER BR[jl4]<5 MIN[nl][jl2]MASSEY TUNNEL[jl4]<5 MIN",
            status="OK",
            location=Point(-123.94, 57.06),
        )

        self.dms.id = "1"
        self.dms.save()

        self.dms_2.id = "2"
        self.dms_2.save()

        self.serializer = DmsSerializer(self.dms)
        self.serializer_two = DmsSerializer(self.dms_2)

    def test_serializer_data(self):
        assert self.serializer.data['name'] == \
                "DMS10"
        assert self.serializer.data['location']['coordinates'] == \
               [-124.64, 58.66]
        assert self.serializer_two.data['name'] == \
                "DMS11"
        assert self.serializer_two.data['location']['coordinates'] == \
               [-123.94, 57.06]
