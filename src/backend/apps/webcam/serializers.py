from apps.webcam.models import Webcam
from django.conf import settings
from rest_framework import serializers


class WebcamSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()
    highway_display = serializers.SerializerMethodField()
    regional_weather_station = serializers.SerializerMethodField()
    local_weather_station = serializers.SerializerMethodField()
    hev_station = serializers.SerializerMethodField()

    class Meta:
        model = Webcam
        exclude = (
            "created_at",
            "modified_at",
        )

    def get_links(self, obj):
        local_root = settings.DRIVEBC_IMAGE_BASE_URL
        proxy_root = settings.DRIVEBC_IMAGE_PROXY_URL
        webcam_id = obj.id

        links = {
            "imageDisplay": f"{local_root}images/{webcam_id}.jpg",
            "replayTheDay": f"{proxy_root}ReplayTheDay/json/{webcam_id}.json",
        }

        return links

    # use road name if highway doesn't exist
    def get_highway_display(self, obj):
        return obj.highway if obj.highway != '0' else obj.highway_description

    def get_regional_weather_station(self, obj):
        if obj.regional_weather_station:
            return obj.regional_weather_station.code

        return None

    def get_local_weather_station(self, obj):
        if obj.local_weather_station:
            return obj.local_weather_station.code

        return None

    def get_hev_station(self, obj):
        if obj.hev_station:
            return obj.hev_station.code

        return None
