from apps.ferry.models import CoastalFerryStop, Ferry
from apps.ferry.serializers import CoastalFerryStopAPISerializer, FerryRouteSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets


class FerryAPI(CachedListModelMixin):
    queryset = Ferry.objects.all()
    serializer_class = FerryRouteSerializer
    cache_key = CacheKey.FERRY_LIST
    cache_timeout = CacheTimeout.FERRY_LIST

    def fetch_list_data(self, queryset=None):
        qs = Ferry.objects.all().order_by('route_id', 'priority')
        routes = {}
        for ferry in qs:
            if ferry.route_id not in routes:
                ferry.vessels_list = []
                routes[ferry.route_id] = ferry

            routes[ferry.route_id].vessels_list.append(ferry)

        return self.get_serializer(list(routes.values()), many=True).data

class FerryViewSet(FerryAPI, viewsets.ReadOnlyModelViewSet):
    pass

class CoastalFerryAPI(CachedListModelMixin):
    queryset = CoastalFerryStop.objects.filter(parent_stop=None)
    serializer_class = CoastalFerryStopAPISerializer
    cache_key = CacheKey.COASTAL_FERRY_LIST
    cache_timeout = CacheTimeout.COASTAL_FERRY_LIST

class CoastalViewSet(CoastalFerryAPI, viewsets.ReadOnlyModelViewSet):
    pass
