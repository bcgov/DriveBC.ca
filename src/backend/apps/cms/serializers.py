from apps.cms.models import FAQ, Bulletin, Advisory
from rest_framework import serializers
from wagtail.templatetags import wagtailcore_tags
import environ

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
    bulletin_body = serializers.SerializerMethodField()

    def get_bulletin_body(self, obj):
        rended_body = wagtailcore_tags.richtext(obj.bulletin_body)
        result = (
            rended_body.replace("/drivebc-cms", "http://" + 
                                environ.Env().list("DJANGO_ALLOWED_HOSTS")[0] 
                                + ":8000/drivebc-cms")
            .replace("/media", "http://" + 
                     environ.Env().list("DJANGO_ALLOWED_HOSTS")[0] + 
                     ":8000/media") 
        )

        return result

    class Meta:
        model = Bulletin
        exclude = [
            # "created_at",
            # "modified_at",
        ] + CMS_FIELDS


class AdvisorySerializer(serializers.ModelSerializer):
    advisory_body = serializers.SerializerMethodField()

    def get_advisory_body(self, obj):
        rended_body = wagtailcore_tags.richtext(obj.advisory_body)
        result = (
            rended_body.replace("/drivebc-cms", "http://" + 
                                environ.Env().list("DJANGO_ALLOWED_HOSTS")[0] 
                                + ":8000/drivebc-cms")
            .replace("/media", "http://" + 
                     environ.Env().list("DJANGO_ALLOWED_HOSTS")[0] + 
                     ":8000/media") 
        )
        return result
    
    class Meta:
        model = Advisory
        # fields = '__all__'
        exclude = [
            # "created_at",
            # "modified_at",
        ] + CMS_FIELDS