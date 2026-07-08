from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from .fields import (
    WildfireAreaPropertiesField,
    WildfirePointGeometryField,
    WildfirePointPropertiesField,
)
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
    def to_internal_value(self, data):
        return {
            'geometry': WildfirePointGeometryField().to_internal_value(data),
            **WildfirePointPropertiesField().to_internal_value(data),
        }


class WildfireAreaSerializer(serializers.Serializer):
    features = WildfireAreaFeedSerializer(many=True)


class WildfirePointSerializer(serializers.Serializer):
    features = WildfirePointFeedSerializer(many=True)

    def to_internal_value(self, data):
        if 'collection' in data:
            data = {**data, 'features': data['collection']}
        return super().to_internal_value(data)
