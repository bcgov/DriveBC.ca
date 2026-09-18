from datetime import timezone as dt_timezone  # Use standard Python timezone

from apps.dms.models import Dms
from rest_framework import serializers


class DmsSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    updated_datetime_utc = serializers.DateTimeField(
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

    # The description field is used as the name for DMS in the UI, so we override the name field to return the description if it exists.
    def get_name(self, obj): 
        return obj.description if obj.description else obj.name
