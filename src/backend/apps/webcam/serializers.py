from pathlib import Path

from django.conf import settings
from rest_framework import serializers

from apps.webcam.models import Webcam


class WebcamSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()

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
            "imageSource": f"{proxy_root}webcam/api/v1/webcams/{webcam_id}/imageSource",
            "imageDisplay": f"{local_root}images/{webcam_id}.jpg",
            "imageThumbnail":
                f"{proxy_root}bchighwaycam/pub/cameras/tn/{webcam_id}.jpg",
            "currentImage": f"{proxy_root}webcam/imageUpdate.php?cam={webcam_id}",
            "replayTheDay": f"{proxy_root}ReplayTheDay/json/{webcam_id}.json",
        }

        return links

    def get_group(self, obj):
        return Webcam.objects.filter(location=obj.location).order_by('id').first().id
