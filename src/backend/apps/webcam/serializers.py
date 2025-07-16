from apps.webcam.models import Webcam
from django.conf import settings
from rest_framework import serializers


class WebcamSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()
    highway_display = serializers.SerializerMethodField()

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
