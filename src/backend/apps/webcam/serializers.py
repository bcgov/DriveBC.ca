from pathlib import Path

import environ
from apps.webcam.models import Webcam
from rest_framework import serializers

# Base dir and env
BASE_DIR = Path(__file__).resolve().parents[4]
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env', overwrite=True)


class WebcamSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()

    class Meta:
        model = Webcam
        exclude = (
            "created_at",
            "modified_at",
        )

    def get_links(self, obj):
        api_root = env("DRIVEBC_IMAGE_API_BASE_URL")
        proxy_root = env("DRIVEBC_IMAGE_PROXY_URL")
        webcam_id = obj.id

        links = {
            "imageSource": f"{proxy_root}webcam/api/v1/webcams/{webcam_id}/imageSource",
            "imageDisplay": f"{proxy_root}bchighwaycam/pub/cameras/{webcam_id}.jpg",
            "imageThumbnail":
                f"{proxy_root}bchighwaycam/pub/cameras/tn/{webcam_id}.jpg",
            "currentImage": f"{proxy_root}webcam/imageUpdate.php?cam={webcam_id}",
            "replayTheDay": f"{api_root}ReplayTheDay/json/{webcam_id}.json",
        }

        return links
