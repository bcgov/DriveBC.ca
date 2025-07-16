from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework import viewsets


class WebcamAPI:
    queryset = Webcam.objects.filter(should_appear=True)
    serializer_class = WebcamSerializer


class WebcamViewSet(WebcamAPI, viewsets.ReadOnlyModelViewSet):
    pass


class WebcamTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebcamAPI.queryset
    serializer_class = WebcamAPI.serializer_class
