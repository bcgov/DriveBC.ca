import time
from datetime import datetime, timezone

from apps.webcam.models import Webcam
from django.conf import settings
from rest_framework import serializers


class WebcamSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False, allow_blank=True)
    caption = serializers.CharField(required=False, allow_blank=True)
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["caption"] = instance.caption_override or instance.caption
        data["name"] = instance.name_override or instance.name
        return data

    def get_name(self, obj):
        return obj.name_override if obj.name_override else obj.name

    def get_caption(self, obj):
        return obj.caption_override if obj.caption_override else obj.caption

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
        # threshold = obj.update_period_mean * 1.1
        threshold = max(obj.update_period_mean * 1.1, obj.update_period_mean + 2 * obj.update_period_stddev)

        return diff_seconds > threshold

    def get_marked_delayed(self, obj):
        if not obj.last_update_modified or not obj.update_period_mean:
            return False  # or True if you prefer to default stale when data missing

        now = datetime.now(timezone.utc)
        diff_seconds = (now - obj.last_update_modified).total_seconds()
        # threshold = obj.update_period_mean * 3
        threshold = 2 * obj.update_period_mean + 2 * obj.update_period_stddev

        return diff_seconds > threshold
