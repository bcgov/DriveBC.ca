from apps.wildfire.models import Wildfire
from apps.wildfire.serializers import WildfireSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets


class WildfireAPI(CachedListModelMixin):
    queryset = Wildfire.objects.filter(status='Out of Control')
    serializer_class = WildfireSerializer
    cache_key = CacheKey.WILDFIRE_LIST
    cache_timeout = CacheTimeout.WILDFIRE_LIST

class WildfireViewSet(WildfireAPI, viewsets.ReadOnlyModelViewSet):
    pass