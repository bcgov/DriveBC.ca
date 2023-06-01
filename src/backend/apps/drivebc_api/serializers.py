from rest_framework import serializers


class DrivebcRouteSerializer(serializers.Serializer):
    FASTEST = "fastest"
    SHORTEST = "shortest"
    CRITERIA_CHOICES = [(FASTEST, "Fastest"), (SHORTEST, "Shortest")]
    KILOMETRES = "km"
    MILES = "mi"
    DISTANCE_UNIT_CHOICES = [(KILOMETRES, "km"), (MILES, "mi")]
    srsCode = serializers.CharField(max_length=5, source="srs_code")
    criteria = serializers.ChoiceField(choices=CRITERIA_CHOICES)
    distanceUnit = serializers.ChoiceField(
        choices=DISTANCE_UNIT_CHOICES, source="distance_unit"
    )
    distance = serializers.FloatField()
    time = serializers.FloatField(source="route_time")
    routeFound = serializers.BooleanField(source="is_route_found")
    points = serializers.ListField(
        child=serializers.ListField(child=serializers.FloatField())
    )
    route = serializers.ListField(
        child=serializers.ListField(child=serializers.FloatField()),
        source="route_points",
    )
