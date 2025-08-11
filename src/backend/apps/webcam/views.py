from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework import viewsets

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse, Http404
from .models import Webcam
import os
from apps.consumer.models import ImageIndex
from apps.shared.status import get_image_list

import requests

IMAGE_CACHE_DIR = os.getenv("IMAGE_CACHE_DIR", "/app/data/webcams/cache")
S3_BASE_URL = os.getenv("S3_IMAGE_BASE_URL", "http://minio:9000/test-s3-bucket/processed")

class WebcamAPI:
    queryset = Webcam.objects.filter(should_appear=True)
    serializer_class = WebcamSerializer

class WebcamViewSet(WebcamAPI, viewsets.ReadOnlyModelViewSet):
    @action(detail=True, methods=['get'], url_path='imageSource')
    def image_source(self, request, pk=None):
        image_path = f"/app/data/webcams/originals/{pk}.jpg"
        if not os.path.exists(image_path):
            raise Http404("Image not found.")

        return FileResponse(open(image_path, 'rb'), content_type='image/jpeg')
    
    @action(detail=True, methods=['get'], url_path='replayTheDay')
    def replayTheDay(self, request, pk=None):
        timestamps = get_image_list(pk, "REPLAY_THE_DAY_HOURS")
        return Response(timestamps, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path='timelapse')
    def timelapse(self, request, pk=None):
        timestamps = get_image_list(pk, "TIMELAPSE_HOURS")
        return Response(timestamps, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='cameraImage')
    def cameraImage(self, request, pk=None):
        timestamps = get_image_list(pk, "TIMELAPSE_HOURS")
        if isinstance(timestamps, list) and timestamps:
            latest_image = sorted(timestamps)[-1]

        response_data = {
            "CameraImage": {
                "camera_provider_list_cameras_endpoint": "webcams.json",
                "camera_provider_camera_image_endpoint": f"api/webcams/{pk}/timelapse/",
                "camera_provider_image_template": f"images/{pk}/{latest_image}",
                "camera_provider_api_root": "http://localhost:8000/api/webcams/"
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=['get'],
        url_path=r'(?P<filename>[0-9]{12})/timelapse'
    )
    def cachedTimelapse(self, request, pk=None, filename=None):
        cache_folder = os.path.join(IMAGE_CACHE_DIR, str(pk))
        os.makedirs(cache_folder, exist_ok=True)

        cache_path = os.path.join(cache_folder, f'{filename}.jpg')

        # Serve from cache if exists
        if os.path.exists(cache_path):
            return FileResponse(open(cache_path, "rb"), content_type="image/jpeg")

        # Fetch from S3
        s3_url = f"{S3_BASE_URL}/{pk}/{filename}.jpg"
        resp = requests.get(s3_url, stream=True)

        if resp.status_code != 200:
            raise Http404("Image not found in S3.")

        # Save to cache
        with open(cache_path, "wb") as f:
            for chunk in resp.iter_content(1024):
                f.write(chunk)

        return FileResponse(open(cache_path, "rb"), content_type="image/jpeg")

class WebcamTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebcamAPI.queryset
    serializer_class = WebcamAPI.serializer_class
