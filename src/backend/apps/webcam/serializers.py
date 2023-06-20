from apps.webcam.models import Webcam
from rest_framework import serializers


class WebcamSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()

    class Meta:
        model = Webcam
        exclude = (
            "created_at",
            "modified_at",
        )

    def get_links(self, obj):
        api_root = "https://images.drivebc.ca/"
        webcam_id = obj.id

        links = {
            "imageSource": f"{api_root}webcam/api/v1/webcams/{webcam_id}/imageSource",
            "imageDisplay": f"{api_root}bchighwaycam/pub/cameras/{webcam_id}.jpg",
            "imageThumbnail": f"{api_root}bchighwaycam/pub/cameras/tn/{webcam_id}.jpg",
            "currentImage": f"{api_root}webcam/imageUpdate.php?cam={webcam_id}",
            "replayTheDay": f"{api_root}ReplayTheDay/player.html?cam={webcam_id}",
        }

        return links
