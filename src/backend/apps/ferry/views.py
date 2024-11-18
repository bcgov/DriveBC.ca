from apps.ferry.models import Ferry
from apps.ferry.serializers import FerryRouteSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets


class FerryAPI(CachedListModelMixin):
    queryset = Ferry.objects.all()
    serializer_class = FerryRouteSerializer
    cache_key = CacheKey.FERRY_LIST
    cache_timeout = CacheTimeout.FERRY_LIST


class FerryViewSet(FerryAPI, viewsets.ReadOnlyModelViewSet):
    pass
