from django.utils import timezone
from apps.dms.models import Dms
from rest_framework import serializers
from datetime import timezone as dt_timezone  # Use standard Python timezone


class DmsSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    updated_datetime_utc = serializers.DateTimeField(
        default_timezone=dt_timezone.utc, 
        allow_null=True, 
        required=False
    )
    message_expiry_datetime_utc = serializers.DateTimeField(
        default_timezone=dt_timezone.utc, 
        allow_null=True, 
        required=False
    )
    cache_datetime_utc = serializers.DateTimeField(
        default_timezone=dt_timezone.utc, 
        allow_null=True, 
        required=False
    )

    class Meta:
        model = Dms
        exclude = (
            "created_at",
            "modified_at",
        )

    def get_name(self, obj):
        return obj.name_override if obj.name_override else obj.name
