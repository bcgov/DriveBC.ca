from datetime import datetime, time

from apps.border.enums import LANE_TYPE
from apps.border.models import BorderCrossing, BorderCrossingLanes
from django.db.models import Max
from rest_framework import serializers


class BorderCrossingLanesSerializer(serializers.ModelSerializer):
    delay_minutes = serializers.SerializerMethodField()

    class Meta:
        model = BorderCrossingLanes
        exclude = (
            "created_at",
            "modified_at",
        )

    def get_delay_minutes(self, obj, test_time=None):
        # Hardcoded Aldergrove closed hours
        # northbound only NEXUS lane
        if obj.id == 758:
            current_time = test_time or datetime.now().time()

            # closed between 8pm-12pm past midnight
            if time(20, 0) <= current_time or current_time <= time(12, 0):
                return 'closed'

        # other lanes
        elif obj.border_crossing_id == 136:
            current_time = test_time or datetime.now().time()

            # closed between 12am-8am
            if time(0, 0) <= current_time <= time(8, 0):
                return 'closed'

        return obj.delay_minutes


class BorderCrossingSerializer(serializers.ModelSerializer):
    lanes = BorderCrossingLanesSerializer(many=True, read_only=True, source='bordercrossinglanes_set')
    last_updated = serializers.SerializerMethodField()

    class Meta:
        model = BorderCrossing
        exclude = (
            "created_at",
            "modified_at",
        )

    def get_last_updated(self, obj):
        last_updated = obj.bordercrossinglanes_set.aggregate(Max('last_updated'))['last_updated__max']
        return last_updated

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Filter out NEXUS lanes for these border crossings
        if instance.id in [136, 137]:
            representation['lanes'] = [lane for lane in representation['lanes'] if self.filter_lane(lane)]

        return representation

    def filter_lane(self, lane):
        # omit NEXUS lanes
        return lane['lane_type'] != LANE_TYPE.NEXUS
