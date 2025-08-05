import json
from django.conf import settings
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
    
    @action(detail=True, methods=['get'], url_path='timelapse')
    def timelapse(self, request, pk=None):
        # Path to the index.json file
        index_file_path = os.path.join(settings.BASE_DIR, "app", "data", "images", str(pk), "index.json")

        latest_image = None
        if os.path.exists(index_file_path):
            try:
                with open(index_file_path, "r", encoding="utf-8") as f:
                    image_list = json.load(f)
                    if isinstance(image_list, list) and image_list:
                        # Assuming the filenames are in order or sortable
                        latest_image = sorted(image_list)[-1]
            except Exception as e:
                print(f"Failed to read index.json for camera {pk}: {e}")

        response_data = {
            "CameraImage": {
                "camera_provider_list_cameras_endpoint": "webcams.json",
                "camera_provider_camera_image_endpoint": f"images/{pk}/index.json",
                "camera_provider_image_template": f"images/{pk}/{latest_image}",
                "camera_provider_api_root": "http://localhost:8000/api/webcams/"
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)


class WebcamTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebcamAPI.queryset
    serializer_class = WebcamAPI.serializer_class
