from apps.ferry.models import CoastalFerryRoute, CoastalFerryStop, CoastalFerryStopTime, Ferry
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

    def fetch_list_data(self, queryset=None):
        stops = list(CoastalFerryStop.objects.filter(parent_stop=None))
        stop_map = {s.id: s for s in stops}

        for s in stops:
            s.routes_list = set()

        associations = CoastalFerryStopTime.objects.values_list(
            'trip__route_id',
            'stop_id',
            'stop__parent_stop_id'
        ).order_by().distinct()

        all_routes = {r.id: r for r in CoastalFerryRoute.objects.all()}

        for route_id, stop_id, parent_stop_id in associations:
            route = all_routes.get(route_id)
            if not route:
                continue

            if stop_id in stop_map:
                stop_map[stop_id].routes_list.add(route)

            if parent_stop_id and parent_stop_id in stop_map:
                stop_map[parent_stop_id].routes_list.add(route)

        for s in stops:
            s.routes_list = sorted(list(s.routes_list), key=lambda r: r.id)

        return self.get_serializer(stops, many=True).data

class CoastalViewSet(CoastalFerryAPI, viewsets.ReadOnlyModelViewSet):
    pass
