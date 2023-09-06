from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import FAQ, Bulletin, Advisory
from .serializers import FAQSerializer, BulletinSerializer, AdvisorySerializer


class FAQAPIViewSet(ReadOnlyModelViewSet):
    queryset = FAQ.objects.filter(live=True)
    serializer_class = FAQSerializer


class BulletinAPIViewSet(ReadOnlyModelViewSet):
    queryset = Bulletin.objects.filter(live=True)
    serializer_class = BulletinSerializer


class AdvisoryAPIViewSet(ReadOnlyModelViewSet):
    queryset = Advisory.objects
    serializer_class = AdvisorySerializer
