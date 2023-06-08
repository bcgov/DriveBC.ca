from rest_framework import serializers

from apps.shared import enums


class RouteFeedSerializer(serializers.Serializer):
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


class RegionFeedSerializer(serializers.Serializer):
    group = serializers.IntegerField()
    name = serializers.CharField(max_length=128)


class RegionGroupFeedSerializer(serializers.Serializer):
    highwayGroup = serializers.IntegerField()
    highwayCamOrder = serializers.IntegerField()


class HighwayFeedSerializer(serializers.Serializer):
    number = serializers.CharField(max_length=32)
    locationDescription = serializers.CharField(max_length=128, allow_blank=True, allow_null=True)


class LocationFeedSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    elevation = serializers.IntegerField()


class DatetimeFeedSerializer(serializers.Serializer):
    time = serializers.DateTimeField(format='%y-%m-%d %H:%M:%S', allow_null=True)


class ImageStatsFeedSerializer(serializers.Serializer):
    markedStale = serializers.BooleanField()
    markedDelayed = serializers.BooleanField()
    updatePeriodMean = serializers.IntegerField()
    updatePeriodStdDev = serializers.IntegerField()
    lastAttempt = DatetimeFeedSerializer()
    lastModified = DatetimeFeedSerializer()


class WebcamFeedSerializer(serializers.Serializer):
    id = serializers.IntegerField()

    # Description
    camName = serializers.CharField(max_length=128)
    caption = serializers.CharField(max_length=256)

    # Location
    region = RegionFeedSerializer()
    regionGroup = RegionGroupFeedSerializer()
    highway = HighwayFeedSerializer()
    location = LocationFeedSerializer()
    orientation = serializers.CharField(max_length=32, allow_blank=True, allow_null=True)  # Can be 'NULL'

    isOn = serializers.BooleanField()
    shouldAppear = serializers.BooleanField()
    isNew = serializers.BooleanField()
    isOnDemand = serializers.BooleanField()

    # Update Period
    imageStats = ImageStatsFeedSerializer()


class WebcamAPISerializer(serializers.Serializer):
    webcams = WebcamFeedSerializer(many=True)
