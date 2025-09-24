from apps.ferry.models import (
    CoastalFerryCalendar,
    CoastalFerryRoute,
    CoastalFerryStop,
    CoastalFerryStopTime,
    CoastalFerryTrip,
    Ferry,
)
from django.db.models import Q
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
    display_category = serializers.SerializerMethodField()

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
        )

    def get_vessels(self, obj):
        grouped = Ferry.objects.filter(route_id=obj.route_id).order_by("id")
        return FerryVesselSerializer(grouped, many=True).data

    def get_id(self, obj):
        return obj.route_id

    def get_display_category(self, obj):
        return 'inlandFerry'


class CoastalFerryStopAPISerializer(serializers.ModelSerializer):
    routes = serializers.SerializerMethodField()
    display_category = serializers.SerializerMethodField()

    class Meta:
        model = CoastalFerryStop
        exclude = (
            "created_at",
            "modified_at",
        )

    def get_routes(self, obj):
        routes = CoastalFerryRoute.objects.filter(
            Q(trips__stop_times__stop=obj) |
            Q(trips__stop_times__stop__parent_stop=obj)
        ).distinct()
        return CoastalFerryRouteSerializer(routes, many=True).data

    def get_display_category(self, obj):
        return 'costalFerry'


class CoastalFerryStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoastalFerryStop
        exclude = (
            "created_at",
            "modified_at",
        )


class CoastalFerryCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoastalFerryCalendar
        exclude = (
            "created_at",
            "modified_at",
        )


class CoastalFerryRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoastalFerryRoute
        exclude = (
            "created_at",
            "modified_at",
        )


class CoastalFerryTripSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoastalFerryTrip
        exclude = (
            "created_at",
            "modified_at",
        )


class CoastalFerryStopTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoastalFerryStopTime
        exclude = (
            "created_at",
            "modified_at",
        )
