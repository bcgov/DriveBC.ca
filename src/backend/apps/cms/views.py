from apps.cms.models import Advisory, Bulletin, Ferry
from apps.cms.serializers import AdvisorySerializer, BulletinSerializer, FerrySerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets


class CMSViewSet:
    def get_serializer_context(self):
        """Adds request to the context of serializer"""
        return {"request": self.request}


class AdvisoryAPI(CMSViewSet, CachedListModelMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Advisory.objects.filter(live=True)
    serializer_class = AdvisorySerializer
    cache_key = CacheKey.ADVISORY_LIST
    cache_timeout = CacheTimeout.DEFAULT


class BulletinAPI(CMSViewSet, CachedListModelMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Bulletin.objects.filter(live=True)
    serializer_class = BulletinSerializer
    cache_key = CacheKey.BULLETIN_LIST
    cache_timeout = CacheTimeout.DEFAULT


class FerryAPI(CMSViewSet, CachedListModelMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Ferry.objects.filter(live=True)
    serializer_class = FerrySerializer
    cache_key = CacheKey.FERRY_LIST
    cache_timeout = CacheTimeout.FERRY_LIST
