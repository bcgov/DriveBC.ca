from rest_framework import serializers

from apps.webcam.models import Webcam


class WebcamSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()

    class Meta:
        model = Webcam
        exclude = ('created_at', 'modified_at', )

    def get_links(self, obj):
        webcam_id = obj.id
        links = {
            "imageDisplay": f"https://images.drivebc.ca/bchighwaycam/pub/cameras/{webcam_id}.jpg",
            "imageThumbnail": f"https://images.drivebc.ca/bchighwaycam/pub/cameras/tn/{webcam_id}.jpg",
            "currentImage": f"https://images.drivebc.ca/webcam/imageUpdate.php?cam={webcam_id}",
            "replayTheDay": f"https://images.drivebc.ca/ReplayTheDay/player.html?cam={webcam_id}"
        }

        return links
