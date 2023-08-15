from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet


class WebcamAPI(CachedListModelMixin):
    queryset = Webcam.objects.all().order_by("highway", "highway_cam_order", "id")
    serializer_class = WebcamSerializer
    cache_key = CacheKey.WEBCAM_LIST
    cache_timeout = CacheTimeout.WEBCAM_LIST


class WebcamViewSet(WebcamAPI, ReadOnlyModelViewSet):
    pass
