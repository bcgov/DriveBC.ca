from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import FAQ
from .serializers import FAQSerializer


class FAQAPIViewSet(ReadOnlyModelViewSet):
    queryset = FAQ.objects.filter(live=True)
    serializer_class = FAQSerializer
