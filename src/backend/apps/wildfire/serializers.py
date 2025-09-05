from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from .fields import WildfireAreaPropertiesField, WildfirePointPropertiesField
from .models import Wildfire


class WildfireInternalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wildfire
        exclude = (
            "created_at",
        )


class WildfireSerializer(serializers.ModelSerializer):
    centroid = serializers.SerializerMethodField()
    display_category = serializers.SerializerMethodField()

    class Meta:
        model = Wildfire
        exclude = (
            "created_at",
        )

    def get_centroid(self, obj):
        if obj.geometry:
            return {
                "type": "Point",
                "coordinates": [obj.geometry.centroid.x, obj.geometry.centroid.y]
            }
        return None

    def get_display_category(self, obj):
        return 'wildfire'


class WildfireAreaFeedSerializer(serializers.Serializer):
    geometry = GeometryField()
    properties = WildfireAreaPropertiesField(source="*")


class WildfirePointFeedSerializer(serializers.Serializer):
    geometry = GeometryField()
    properties = WildfirePointPropertiesField(source="*")


class WildfireAreaSerializer(serializers.Serializer):
    features = WildfireAreaFeedSerializer(many=True)


class WildfirePointSerializer(serializers.Serializer):
    features = WildfirePointFeedSerializer(many=True)
