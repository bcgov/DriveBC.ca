from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from .models import Webcam
import os
from apps.consumer.models import ImageIndex
from apps.shared.status import get_image_list
import boto3
from botocore.config import Config
from django.shortcuts import redirect
import requests

IMAGE_CACHE_DIR = os.getenv("IMAGE_CACHE_DIR", "/app/data/webcams/cache")
BASE_URL = os.getenv("S3_ENDPOINT_URL", "https://moti-int.objectstore.gov.bc.ca")
S3_BASE_URL = f"{BASE_URL.rstrip('/')}/timelapse/processed"


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
        url_path=r'(?P<filename>[0-9]{14})/timelapse'
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

        # Environment variables
        S3_BUCKET = os.getenv("S3_BUCKET")
        S3_REGION = os.getenv("S3_REGION", "us-east-1")
        S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
        S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
        S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "")

        config = Config(
            signature_version='s3v4',
            retries={'max_attempts': 10},
            s3={
                'payload_signing_enabled': False,
                'checksum_validation': False,
                'enable_checksum': False,
                'addressing_style': 'path',
                'use_expect_continue': False  # Disable Expect header
            }
        )

        s3_client = boto3.client(
            "s3",
            region_name=S3_REGION,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            endpoint_url=S3_ENDPOINT_URL,
            config=config
        )   

        try:  
            response = s3_client.get_object(
                Bucket="tran_api_dbc_backup_dev",
                Key=f"processed/{pk}/{filename}.jpg"
            )

            response = StreamingHttpResponse(
                response['Body'].iter_chunks(),
                content_type="image/jpeg"
            )

            return response

        except Exception as e:
            return HttpResponse(
                f"Error fetching image from S3: {str(e)}",
                content_type="text/plain",
                status=500
            )


class WebcamTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebcamAPI.queryset
    serializer_class = WebcamAPI.serializer_class
