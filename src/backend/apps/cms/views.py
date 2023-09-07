from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import TestCMSData
from .serializers import FAQSerializer


class FAQAPIViewSet(ReadOnlyModelViewSet):
    queryset = TestCMSData.objects.filter(live=True)
    serializer_class = FAQSerializer
