from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Advisory, Bulletin
from .serializers import AdvisorySerializer, BulletinSerializer


class AdvisoryAPIViewSet(ReadOnlyModelViewSet):
    queryset = Advisory.objects.filter(live=True)
    serializer_class = AdvisorySerializer


class BulletinAPIViewSet(ReadOnlyModelViewSet):
    queryset = Bulletin.objects.filter(live=True)
    serializer_class = BulletinSerializer
