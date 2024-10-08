from rest_framework import viewsets

from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer


class WebcamAPI(CachedListModelMixin):
    queryset = Webcam.objects.filter(should_appear=True)
    serializer_class = WebcamSerializer
    cache_key = CacheKey.WEBCAM_LIST
    cache_timeout = CacheTimeout.WEBCAM_LIST


class WebcamViewSet(WebcamAPI, viewsets.ReadOnlyModelViewSet):
    pass


class WebcamTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebcamAPI.queryset
    serializer_class = WebcamAPI.serializer_class
