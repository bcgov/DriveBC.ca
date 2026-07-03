from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.wildfire.enums import WILDFIRE_DISPLAY_STATUSES
from apps.wildfire.models import Wildfire
from apps.wildfire.serializers import WildfireSerializer
from rest_framework import viewsets


class WildfireAPI(CachedListModelMixin):
    queryset = Wildfire.objects.filter(status__in=WILDFIRE_DISPLAY_STATUSES)
    serializer_class = WildfireSerializer
    cache_key = CacheKey.WILDFIRE_LIST
    cache_timeout = CacheTimeout.WILDFIRE_LIST


class WildfireViewSet(WildfireAPI, viewsets.ReadOnlyModelViewSet):
    pass
