from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework import viewsets


class CameraViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Webcam.objects.filter(should_appear=True)
    serializer_class = WebcamSerializer
