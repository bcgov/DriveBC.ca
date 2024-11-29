from apps.ferry.models import Ferry
from rest_framework import serializers


class HTMLField(serializers.CharField):
    def to_representation(self, value):
        return value


class FerrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Ferry
        exclude = (
            "created_at",
            "modified_at",
        )


class FerryVesselSerializer(serializers.ModelSerializer):
    schedule_detail = HTMLField()

    class Meta:
        model = Ferry
        fields = (
            # Vessel specific fields
            "id",
            "name",

            # Capacity
            "vehicle_capacity",
            "passenger_capacity",
            "crossing_time_min",
            "weight_capacity_kg",

            # Schedule
            "schedule_type",
            "schedule_detail",
            "special_restriction",
        )


class FerryRouteSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    vessels = serializers.SerializerMethodField()

    class Meta:
        model = Ferry
        exclude = (
            # Exclude vessel specific fields
            "route_id",  # omit since vessel id mapped to route_id
            "name",

            # Capacity
            "vehicle_capacity",
            "passenger_capacity",
            "crossing_time_min",
            "weight_capacity_kg",

            # Schedule
            "schedule_type",
            "schedule_detail",
            "special_restriction",

            # Meta
            "created_at",
            "modified_at",
            "feed_created_at",
            "feed_modified_at",
        )

    def get_vessels(self, obj):
        grouped = Ferry.objects.filter(route_id=obj.route_id).order_by("id")
        return FerryVesselSerializer(grouped, many=True).data

    def get_id(self, obj):
        return obj.route_id
