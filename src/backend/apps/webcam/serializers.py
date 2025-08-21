from apps.webcam.models import Webcam
from django.conf import settings
from rest_framework import serializers
import time


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
        timestamp = int(time.time())

        # default link values
        links = {
            "imageDisplay": f"{local_root}images/{webcam_id}.jpg?t={timestamp}",
        }

        if obj.https_cam:
            # URL when https_cam = True
            links["replayTheDay"] = f"{local_root}api/webcams/{webcam_id}/replayTheDay/"
        else:
            # URL when https_cam = False
            links["replayTheDay"] = f"{proxy_root}ReplayTheDay/json/{webcam_id}.json" 
        return links

    # use road name if highway doesn't exist
    def get_highway_display(self, obj):
        return obj.highway if obj.highway != '0' else obj.highway_description
