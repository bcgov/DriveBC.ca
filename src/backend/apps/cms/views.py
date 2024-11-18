from apps.cms.models import Advisory, Bulletin
from apps.cms.serializers import (
    AdvisorySerializer,
    BulletinSerializer,
    BulletinTestSerializer,
)
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets


class CMSViewSet(viewsets.ReadOnlyModelViewSet):
    def get_serializer_context(self):
        context = super().get_serializer_context()

        """Adds request to the context of serializer"""
        context['request'] = self.request

        return context


class AdvisoryAPI(CachedListModelMixin, CMSViewSet):
    queryset = Advisory.objects.filter(live=True)
    serializer_class = AdvisorySerializer
    cache_key = CacheKey.ADVISORY_LIST
    cache_timeout = CacheTimeout.DEFAULT


class BulletinTestAPI(CachedListModelMixin, CMSViewSet):
    queryset = Bulletin.objects.filter(live=True)
    serializer_class = BulletinTestSerializer
    cache_key = CacheKey.BULLETIN_LIST
    cache_timeout = CacheTimeout.DEFAULT


class BulletinAPI(BulletinTestAPI):
    serializer_class = BulletinSerializer
