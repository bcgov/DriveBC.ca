from apps.cms.models import TestCMSData
from rest_framework import serializers
from apps.cms.models import Advisory
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
        model = TestCMSData
        exclude = [
            "created_at",
            "modified_at",
        ] + CMS_FIELDS


class AdvisorySerializer(serializers.ModelSerializer):
    advisory_description = serializers.SerializerMethodField()

    # get rendered html elements for description and access static media foder
    def get_advisory_description(self, obj):
        rended_description = wagtailcore_tags.richtext(
            obj.advisory_description)
        result = (
            rended_description.replace("/drivebc-cms", "http://" 
                                       + environ.Env()
                                       .list("DJANGO_ALLOWED_HOSTS")[0] 
                                       + ":8000/drivebc-cms")
            .replace("/media", "http://" + 
                     environ.Env().list("DJANGO_ALLOWED_HOSTS")[0] + 
                     ":8000/media") 
        )
        return result
    
    class Meta:
        model = Advisory
        exclude = [
            "title",
            "depth",
            "path",
            "numchild",
            "slug"
        ]