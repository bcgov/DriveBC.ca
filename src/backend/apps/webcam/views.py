from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework import viewsets

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse, Http404
from .models import Webcam  # assuming you have this model
import os


class WebcamAPI:
    queryset = Webcam.objects.filter(should_appear=True)
    serializer_class = WebcamSerializer


class WebcamViewSet(WebcamAPI, viewsets.ReadOnlyModelViewSet):
    @action(detail=True, methods=['get'], url_path='imageSource')
    def image_source(self, request, pk=None):
        image_path = f"/app/backend/apps/consumer/images/webcams/originals/{pk}.jpg"
        if not os.path.exists(image_path):
            raise Http404("Image not found.")

        return FileResponse(open(image_path, 'rb'), content_type='image/jpeg')


class WebcamTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebcamAPI.queryset
    serializer_class = WebcamAPI.serializer_class
