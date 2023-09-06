from apps.cms.models import FAQ, Bulletin, Advisory
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


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        exclude = [
            "created_at",
            "modified_at",
        ] + CMS_FIELDS


class BulletinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bulletin
        exclude = [
            # "created_at",
            # "modified_at",
        ] + CMS_FIELDS


class AdvisorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Advisory
        # fields = '__all__'
        exclude = [
            # "created_at",
            # "modified_at",
        ] + CMS_FIELDS