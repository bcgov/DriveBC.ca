from apps.ferry.models import CoastalFerryStop, Ferry
from apps.ferry.serializers import CoastalFerryStopAPISerializer, FerryRouteSerializer
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets


class FerryAPI(CachedListModelMixin):
    queryset = Ferry.objects.distinct('route_id')
    serializer_class = FerryRouteSerializer


class CoastalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CoastalFerryStop.objects.filter(parent_stop=None)
    serializer_class = CoastalFerryStopAPISerializer


class FerryViewSet(FerryAPI, viewsets.ReadOnlyModelViewSet):
    pass
