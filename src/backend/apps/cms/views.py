from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Advisory
from .serializers import AdvisorySerializer


class AdvisoryAPIViewSet(ReadOnlyModelViewSet):
    queryset = Advisory.objects.filter(live=True)
    serializer_class = AdvisorySerializer
