from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.dms.models import Dms
from apps.dms.serializers import DmsSerializer
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response


class DmsAPI(CachedListModelMixin):
    serializer_class = DmsSerializer
    cache_key = CacheKey.DMS_LIST
    cache_timeout = CacheTimeout.DMS_LIST

    def get_queryset(self):
        all_dms_count = Dms.objects.count()
        if all_dms_count == 0:
            return Dms.objects.none()
        
        on_count = Dms.objects.filter(is_on=True).count()
        if on_count == 0:
            return Dms.objects.all()
        
        return Dms.objects.filter(is_on=True)


class DmsViewSet(DmsAPI, viewsets.ReadOnlyModelViewSet):
    @action(detail=True, methods=['get'])
    def dms(self, request, pk=None):
        dms_objects = Dms.objects.all()
        serializer = DmsSerializer(dms_objects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
