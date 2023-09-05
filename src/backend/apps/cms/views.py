from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Bulletin, Advisory
from .serializers import BulletinSerializer, AdvisorySerializer


class BulletinAPIViewSet(ReadOnlyModelViewSet):
    queryset = Bulletin.objects.filter(live=True)
    serializer_class = BulletinSerializer


class AdvisoryAPIViewSet(ReadOnlyModelViewSet):
    queryset = Advisory.objects
    serializer_class = AdvisorySerializer