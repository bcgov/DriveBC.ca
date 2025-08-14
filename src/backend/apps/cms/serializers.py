from apps.cms.models import Advisory, Bulletin, EmergencyAlert, SubPage
from config.settings import env
from rest_framework import serializers
from wagtail.templatetags.wagtailcore_tags import richtext

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
    subpages = serializers.SerializerMethodField()

    def get_host(self):
        # DBC22-4580: Use frontend URL if it doesn't contain ports
        frontend_url = env('FRONTEND_BASE_URL')
        if frontend_url and not frontend_url.endswith(':3000/'):
            return frontend_url

        # Local environment fallback
        request = self.context.get("request")
        prefix = "https://" if request and request.is_secure() else "http://"
        return prefix + request.get_host() + '/' if request else 'localhost:8000'

    # get rendered html elements and access static media folder
    def get_richtext(self, body):
        if isinstance(body, str):
            blocks = [richtext(body)]
        else:
            blocks = [richtext(block.render()) for block in body]

        res = "\n".join(blocks)
        res = res.replace(
            'href="/drivebc-cms',
            'href="' + self.get_host() + 'drivebc-cms'
        )
        res = res.replace(
            'src="/media',
            'src="' + self.get_host() + 'media'
        )
        return res

    def get_subpages(self, obj):
        # need to retrieve subpages as their specific class for serialization
        subpages = SubPage.objects.filter(page_ptr__in=obj.get_children())
        return SubPageSerializer(subpages, many=True).data

    def get_url_path(self, obj):
        ''' Remove root page's url segment from path '''
        return '/'.join(obj.url_path.split('/')[1:])


class SubPageTestSerializer(CMSSerializer):
    class Meta:
        model = SubPage
        fields = "__all__"


class SubPageSerializer(SubPageTestSerializer):
    body = serializers.SerializerMethodField()

    def get_body(self, obj):
        return self.get_richtext(obj.body)


# Serializer with no method fields for unit tests
class AdvisoryTestSerializer(CMSSerializer):
    class Meta:
        model = Advisory
        fields = "__all__"


class AdvisorySerializer(AdvisoryTestSerializer):
    body = serializers.SerializerMethodField()
    url_path = serializers.SerializerMethodField()
    display_category = serializers.SerializerMethodField()

    def get_body(self, obj):
        return self.get_richtext(obj.body)

    def get_display_category(self, obj):
        return 'advisory'


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


# Serializer with no method fields for unit tests
class EmergencyAlertTestSerializer(CMSSerializer):
    class Meta:
        model = EmergencyAlert
        fields = "__all__"


class EmergencyAlertSerializer(EmergencyAlertTestSerializer):
    alert = serializers.SerializerMethodField()

    def get_alert(self, obj):
        return self.get_richtext(obj.alert)
