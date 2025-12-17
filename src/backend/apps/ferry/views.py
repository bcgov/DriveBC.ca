from apps.ferry.models import CoastalFerryStop, Ferry
from apps.ferry.serializers import CoastalFerryStopAPISerializer, FerryRouteSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets


class FerryAPI(CachedListModelMixin):
    queryset = Ferry.objects.distinct('route_id')
    serializer_class = FerryRouteSerializer
    cache_key = CacheKey.FERRY_LIST
    cache_timeout = CacheTimeout.FERRY_LIST

class FerryViewSet(FerryAPI, viewsets.ReadOnlyModelViewSet):
    pass

class CoastalFerryAPI(CachedListModelMixin):
    queryset = CoastalFerryStop.objects.filter(parent_stop=None)
    serializer_class = CoastalFerryStopAPISerializer
    cache_key = CacheKey.COASTAL_FERRY_LIST
    cache_timeout = CacheTimeout.COASTAL_FERRY_LIST

class CoastalViewSet(CoastalFerryAPI, viewsets.ReadOnlyModelViewSet):
    pass
