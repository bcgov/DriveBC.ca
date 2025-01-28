from pathlib import Path

from rest_framework import serializers
from wagtail.templatetags.wagtailcore_tags import richtext

from apps.cms.models import Advisory, Bulletin


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


class CMSSerializer(serializers.ModelSerializer):
    def get_host(self):
        request = self.context.get("request")
        prefix = "https://" if request and request.is_secure() else "http://"
        return prefix + request.get_host() if request else 'localhost:8000'

    # get rendered html elements and access static media folder
    def get_richtext(self, body):
        if isinstance(body, str):
            blocks = [richtext(body)]
        else:
            blocks = [richtext(block.render()) for block in body]

        res = "\n".join(blocks)
        res = res.replace(
            'href="/drivebc-cms',
            'href="' + self.get_host() + '/drivebc-cms'
        )
        res = res.replace(
            'src="/media',
            'src="' + self.get_host() + '/media'
        )
        return res


# Serializer with no method fields for unit tests
class AdvisoryTestSerializer(CMSSerializer):
    class Meta:
        model = Advisory
        fields = "__all__"


class AdvisorySerializer(AdvisoryTestSerializer):
    body = serializers.SerializerMethodField()

    def get_body(self, obj):
        return self.get_richtext(obj.body)


# Serializer with no method fields for unit tests
class BulletinTestSerializer(CMSSerializer):
    class Meta:
        model = Bulletin
        fields = "__all__"


class BulletinSerializer(BulletinTestSerializer):
    body = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField('get_image_url')

    def get_image_url(self, obj):
        return obj.image.file.url if obj.image else ''

    def get_body(self, obj):
        return self.get_richtext(obj.body)
