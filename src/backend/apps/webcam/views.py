from rest_framework import viewsets

from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer


class WebcamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Webcam.objects.all()
    serializer_class = WebcamSerializer
    filterset_fields = ['region']
