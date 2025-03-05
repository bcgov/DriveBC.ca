from apps.border.models import BorderCrossing
from apps.ferry.serializers import FerryRouteSerializer
from rest_framework import viewsets


class BorderCrossingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BorderCrossing.objects.all()
    serializer_class = FerryRouteSerializer
