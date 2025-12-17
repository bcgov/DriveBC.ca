from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.border.models import BorderCrossing
from apps.border.serializers import BorderCrossingSerializer
from rest_framework import viewsets


class BorderCrossingAPI(CachedListModelMixin):
    queryset = BorderCrossing.objects.all()
    serializer_class = BorderCrossingSerializer
    cache_key = CacheKey.BORDER_CROSSING_LIST
    cache_timeout = CacheTimeout.BORDER_CROSSING_LIST


class BorderCrossingViewSet(BorderCrossingAPI, viewsets.ReadOnlyModelViewSet):
    pass