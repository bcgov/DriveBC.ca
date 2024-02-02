from apps.cms.models import Advisory, Bulletin, Ferry
from rest_framework import serializers
from wagtail.templatetags import wagtailcore_tags

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
    def get_richtext(self, text):
        res = wagtailcore_tags.richtext(text)
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
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.file.url) if obj.image else ''

    def get_body(self, obj):
        return self.get_richtext(obj.body)


class FerrySerializer(CMSSerializer):
    description = serializers.SerializerMethodField()
    seasonal_description = serializers.SerializerMethodField()
    service_hours = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField('get_image_url')

    class Meta:
        model = Ferry
        fields = "__all__"

    def get_image_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.file.url) if obj.image else ''

    def get_description(self, obj):
        return self.get_richtext(obj.description)

    def get_seasonal_description(self, obj):
        return self.get_richtext(obj.seasonal_description)

    def get_service_hours(self, obj):
        return self.get_richtext(obj.service_hours)
