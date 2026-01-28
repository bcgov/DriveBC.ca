from apps.dms.models import Dms
from rest_framework import serializers


class DmsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dms
        exclude = (
            "created_at",
            "modified_at",
        )
