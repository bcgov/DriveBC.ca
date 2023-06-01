from apps.route_planner.models import Route, TravelAdvisoryMessage
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer


class TravelAdvisoryMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelAdvisoryMessage
        fields = (
            "id",
            "title",
            "text",
            "author",
            "pub_date",
            "created_at",
            "modified_at",
        )


class RoutePointSerializer(serializers.Serializer):
    lng = serializers.FloatField()
    lat = serializers.FloatField()


class RouteParameterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    start_location = RoutePointSerializer()
    destination = RoutePointSerializer()


class RouteSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Route
        fields = (
            "id",
            "email",
            "name",
            "start_point",
            "destination_point",
            "route_points",
            "criteria",
            "srs_code",
            "distance_unit",
            "distance",
            "route_time",
        )
        geo_field = "route_points"
