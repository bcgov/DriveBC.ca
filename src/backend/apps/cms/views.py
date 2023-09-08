from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import TestCMSData, Advisory
from .serializers import FAQSerializer, AdvisorySerializer


class FAQAPIViewSet(ReadOnlyModelViewSet):
    queryset = TestCMSData.objects.filter(live=True)
    serializer_class = FAQSerializer


class AdvisoryAPIViewSet(ReadOnlyModelViewSet):
    queryset = Advisory.objects.filter(live=True)
    serializer_class = AdvisorySerializer
