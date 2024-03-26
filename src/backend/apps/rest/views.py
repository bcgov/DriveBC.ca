from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.rest.models import RestStop
from apps.rest.serializers import RestStopSerializer
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response


class RestStopAPI(CachedListModelMixin):
    queryset = RestStop.objects.all()
    serializer_class = RestStopSerializer
    cache_key = CacheKey.REST_STOP_LIST
    cache_timeout = CacheTimeout.REST_STOP_LIST


class RestStopViewSet(RestStopAPI, viewsets.ReadOnlyModelViewSet):
    @action(detail=True, methods=['get'])
    def reststop(self, request, pk=None):
        rest_stop_objects = RestStop.objects.all()
        serializer = RestStopSerializer(rest_stop_objects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
