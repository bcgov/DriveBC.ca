from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework import viewsets


class WebcamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Webcam.objects.all().order_by("highway", "highway_cam_order", "id")
    serializer_class = WebcamSerializer
