from apps.dms.models import Dms
from rest_framework import serializers


class DmsSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    class Meta:
        model = Dms
        exclude = (
            "created_at",
            "modified_at",
        )

    def get_name(self, obj):
        return obj.name_override if obj.name_override else obj.name
