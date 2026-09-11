from datetime import timezone as dt_timezone  # Use standard Python timezone

from apps.dms.models import Dms
from rest_framework import serializers


class DmsSerializer(serializers.ModelSerializer):
    cache_datetime_utc = serializers.DateTimeField(
        default_timezone=dt_timezone.utc,
        allow_null=True,
        required=False
    )

    def update(self, instance, validated_data):
        if all(
            getattr(instance, field_name) == value
            for field_name, value in validated_data.items()
        ):
            return instance

        return super().update(instance, validated_data)

    class Meta:
        model = Dms
        exclude = (
            "created_at",
            "modified_at",
        )
