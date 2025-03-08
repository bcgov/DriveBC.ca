from apps.border.models import BorderCrossing
from apps.border.serializers import BorderCrossingSerializer
from rest_framework import viewsets


class BorderCrossingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BorderCrossing.objects.all()
    serializer_class = BorderCrossingSerializer
