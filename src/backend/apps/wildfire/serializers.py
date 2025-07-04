from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from .fields import WildfirePropertiesField
from .models import Wildfire


class WildfireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wildfire
        exclude = (
            "created_at",
        )


class WildfireFeedSerializer(serializers.Serializer):
    geometry = GeometryField()
    properties = WildfirePropertiesField(source="*")


class WildfireAPISerializer(serializers.Serializer):
    features = WildfireFeedSerializer(many=True)
