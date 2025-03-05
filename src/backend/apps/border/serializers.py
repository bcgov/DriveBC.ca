from apps.border.models import BorderCrossing, BorderCrossingLanes
from django.db.models import Max
from rest_framework import serializers


class BorderCrossingLanesSerializer(serializers.ModelSerializer):
    class Meta:
        model = BorderCrossingLanes
        exclude = (
            "created_at",
            "modified_at",
        )


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
