from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Advisory, Bulletin
from .serializers import AdvisorySerializer, BulletinSerializer


class CMSViewSet(ReadOnlyModelViewSet):
    def get_serializer_context(self):
        """Adds request to the context of serializer"""
        return {"request": self.request}


class AdvisoryAPIViewSet(CMSViewSet):
    queryset = Advisory.objects.filter(live=True)
    serializer_class = AdvisorySerializer


class BulletinAPIViewSet(CMSViewSet):
    queryset = Bulletin.objects.filter(live=True)
    serializer_class = BulletinSerializer
