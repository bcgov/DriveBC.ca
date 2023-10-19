from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework.viewsets import ModelViewSet


class WebcamAPI(CachedListModelMixin):
    queryset = Webcam.objects.all().order_by("highway", "highway_cam_order", "id")
    serializer_class = WebcamSerializer
    cache_key = CacheKey.WEBCAM_LIST
    cache_timeout = CacheTimeout.WEBCAM_LIST


class WebcamViewSet(WebcamAPI, ModelViewSet):
    def create(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class WebcamTestViewSet(ModelViewSet):
    queryset = WebcamAPI.queryset
    serializer_class = WebcamAPI.serializer_class
