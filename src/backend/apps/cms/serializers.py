from apps.cms.models import Advisory, Bulletin
from rest_framework import serializers

CMS_FIELDS = [
    "live",
    "has_unpublished_changes",
    "first_published_at",
    "last_published_at",
    "go_live_at",
    "expire_at",
    "expired",
    "latest_revision",
    "live_revision"
]


class AdvisorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Advisory
        fields = "__all__"


class BulletinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bulletin
        fields = "__all__"
