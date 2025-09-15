from apps.webcam.models import Webcam
from django.conf import settings
from rest_framework import serializers
import time
from datetime import datetime, timedelta, timezone


class WebcamSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()
    highway_display = serializers.SerializerMethodField()
    marked_stale = serializers.SerializerMethodField()
    marked_delayed = serializers.SerializerMethodField()

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

        if obj.https_cam:
            links = {
            "imageDisplay": f"{local_root}images/{webcam_id}.jpg?t={timestamp}",
            "replayTheDay": f"{local_root}api/webcams/{webcam_id}/replayTheDay/",
        }
        else:
            links = {
            "imageDisplay": f"{local_root}images/{webcam_id}.jpg",
            "replayTheDay": f"{proxy_root}ReplayTheDay/json/{webcam_id}.json",
        }
        return links

    # use road name if highway doesn't exist
    def get_highway_display(self, obj):
        return obj.highway if obj.highway != '0' else obj.highway_description
    
    def get_marked_stale(self, obj):
        if not obj.last_update_modified or not obj.update_period_mean:
            return False

        now = datetime.now(timezone.utc)
        diff_seconds = (now - obj.last_update_modified).total_seconds()
        threshold = obj.update_period_mean * 1.1

        return diff_seconds > threshold

    def get_marked_delayed(self, obj):
        if not obj.last_update_modified or not obj.update_period_mean:
            return False  # or True if you prefer to default stale when data missing

        now = datetime.now(timezone.utc)
        diff_seconds = (now - obj.last_update_modified).total_seconds()
        threshold = obj.update_period_mean * 3

        return diff_seconds > threshold
