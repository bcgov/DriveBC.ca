from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework import viewsets
from datetime import datetime, time, date
from urllib.parse import urlparse
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from .models import Webcam
import os
from apps.shared.status import get_image_list
import boto3
from botocore.config import Config
from django.utils.dateparse import parse_date
import zipstream
from django.utils import timezone
from django.urls import reverse
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.permissions import IsAdminUser, AllowAny
from zoneinfo import ZoneInfo
from django.core.cache import cache

BASE_URL = os.getenv("S3_ENDPOINT_URL")
S3_BUCKET = os.getenv("S3_BUCKET")
S3_BASE_URL = f"{BASE_URL.rstrip('/')}/{S3_BUCKET}/webcams/timelapse"


class WebcamAPI(CachedListModelMixin):
    queryset = Webcam.objects.filter(should_appear=True)
    serializer_class = WebcamSerializer
    cache_key = CacheKey.WEBCAM_LIST
    cache_timeout = CacheTimeout.WEBCAM_LIST

@extend_schema_view(
    list=extend_schema(exclude=True),
    retrieve=extend_schema(exclude=True),
)
class CameraViewSet(WebcamAPI, viewsets.ReadOnlyModelViewSet):
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single webcam with caching.
        """
        pk = kwargs.get('pk')
        cache_key = f"webcam_detail_{pk}"
        
        # Try to get from cache
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        
        # If not in cache, get from database
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Cache the result
        cache.set(cache_key, data, CacheTimeout.WEBCAM_INDIVIDUAL)
        
        return Response(data)
    
    @action(
            detail=True, 
            methods=['get'], 
            url_path='replayTheDay',
            )
    def replayTheDay(self, request, pk=None):
        """
        Get replay the day timestamps with caching.
        """
        cache_key = f"webcam_replay_{pk}"
        
        # Try to get from cache
        cached_timestamps = cache.get(cache_key)
        if cached_timestamps is not None:
            return Response(cached_timestamps, status=status.HTTP_200_OK)
        
        # If not in cache, generate timestamps
        timestamps = get_image_list(pk, "REPLAY_THE_DAY_HOURS")
        
        # Cache the result
        cache.set(cache_key, timestamps, CacheTimeout.WEBCAM_REPLAYTHEDAY)
        
        return Response(timestamps, status=status.HTTP_200_OK)

    @action(
            detail=False, 
            methods=['get'], 
            url_path='staleAndDelayed',
            )
    def staleAndDelayed(self, request, pk=None):

        now = timezone.now()
        qs = Webcam.objects.filter(should_appear=True, is_on=True).only(
            "id", "last_update_modified", "update_period_mean", "update_period_stddev"
        )

        stale_ids = sorted([w.id for w in qs if self.is_stale(w, now)])
        count_stale = len(stale_ids)
        delayed_ids = sorted([w.id for w in qs if self.is_delayed(w, now)])
        count_delayed = len(delayed_ids)
        totalCams = qs.count()
        host = request.get_host()
        path = reverse('webcams-staleAndDelayed')
        self_link = f"{request.scheme}://{host}{path}"

        data = {
            "links": {
                "self": self_link
            },
            "time": timezone.now().strftime("%Y-%m-%d %H:%M:%S"),
            "cams": totalCams,
            "stale": count_stale,
            "delayed": count_delayed,
            "stale_ids": stale_ids,
            "delayed_ids": delayed_ids,
        }

        return Response(data)

    # internal logic
    def _original_image_impl(self, pk):
        image_path = f"/app/images/webcams/originals/{pk}.jpg"
        if not os.path.exists(image_path):
            raise Http404("Image not found.")

        return FileResponse(open(image_path, 'rb'), content_type='image/jpeg')

    def _timelapse_impl(self, pk):
        timestamps = get_image_list(pk, "TIMELAPSE_HOURS")
        return Response(timestamps, status=status.HTTP_200_OK)

    def _timelapse_image_impl(self, request, pk=None, filename=None):
        # Environment variables
        S3_BUCKET = os.getenv("S3_BUCKET")
        S3_REGION = os.getenv("S3_REGION")
        S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
        S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
        S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")

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
                Bucket=S3_BUCKET,
                Key=f"webcams/timelapse/{pk}/{filename}.jpg"
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

    def _download(self, request, pk=None):
        from_date_str = request.query_params.get("from")
        to_date_str = request.query_params.get("to")  
        from_time_str = request.query_params.get("time_from")
        to_time_str = request.query_params.get("time_to")
        timezone_str = request.query_params.get("timezone", "UTC")

        tz = ZoneInfo(timezone_str)

        from_date = parse_date(from_date_str) if from_date_str else None
        to_date = parse_date(to_date_str) if to_date_str else None

        from_time = datetime.strptime(from_time_str, "%H:%M").time() if from_time_str else time.min
        to_time = datetime.strptime(to_time_str, "%H:%M").time() if to_time_str else time.max

        base_from_date = from_date or date.min
        base_to_date = to_date or datetime.now(tz).date()

        local_from_dt = datetime.combine(base_from_date, from_time, tzinfo=tz)
        local_to_dt = datetime.combine(base_to_date, to_time, tzinfo=tz)

        # Convert to UTC
        from_dt_utc = local_from_dt.astimezone(ZoneInfo("UTC"))
        to_dt_utc = local_to_dt.astimezone(ZoneInfo("UTC"))

        all_images = get_image_list(pk, "TIMELAPSE_HOURS")
        if from_dt_utc and to_dt_utc:
            start_dt = from_dt_utc
            end_dt = to_dt_utc

            filtered_images = []
            for img in all_images:
                ts_str = img.replace(".jpg", "")
                img_dt = datetime.strptime(ts_str, "%Y%m%d%H%M%S").replace(tzinfo=ZoneInfo("UTC"))
                if start_dt <= img_dt <= end_dt:
                    filtered_images.append(img)
        else:
            filtered_images = all_images

        if not filtered_images:
            return Response({"detail": "No images found."}, status=404)

        # --- CREATE S3 CLIENT ONCE ---
        S3_BUCKET = os.getenv("S3_BUCKET")
        S3_REGION = os.getenv("S3_REGION")
        S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
        S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
        S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")

        config = Config(
            signature_version='s3v4',
            retries={'max_attempts': 10},
            s3={
                'payload_signing_enabled': False,
                'checksum_validation': False,
                'enable_checksum': False,
                'addressing_style': 'path',
                'use_expect_continue': False
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

        def s3_file_iterator(key: str, chunk_size: int = 65536):
            """Stream S3 object in chunks without loading into memory."""
            obj = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
            body = obj["Body"]
            while True:
                chunk = body.read(chunk_size)
                if not chunk:
                    break
                yield chunk

        # --- STREAMING ZIP ---
        z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)

        for img in filtered_images:
            key = f"webcams/timelapse/{pk}/{img}.jpg"  # S3 key
            filename_in_zip = f"{img.split('/')[-1]}.jpg"
            try:
                z.write_iter(filename_in_zip, s3_file_iterator(key))
            except Exception as e:
                print(f"Error adding {img}: {e}")
                continue

        response = StreamingHttpResponse(z, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="images.zip"'
        return response

    # Admin-only endpoint
    @action(
        detail=True,
        methods=['get'],
        url_path='admin-originalImage',
        permission_classes=[IsAdminUser],
    )
    def original_image_admin(self, request, pk=None):
        user = request.user
        print(user, user.is_authenticated, user.is_staff)
        if not user.is_authenticated or not user.is_staff:
            return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        return self._original_image_impl(pk)

    @action(
        detail=True,
        methods=['get'],
        url_path='admin-timelapse',
        permission_classes=[IsAdminUser],
    )
    def timelapse_admin(self, request, pk=None):
        user = request.user
        if not user.is_authenticated or not user.is_staff:
            return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        return self._timelapse_impl(pk)

    @action(
        detail=True,
        methods=['get'],
        url_path=r'admin-timelapse/(?P<filename>[0-9]{14})',
        permission_classes=[IsAdminUser],
    )
    def timelapse_image_admin(self, request, pk=None, filename=None):
        user = request.user
        if not user.is_authenticated or not user.is_staff:
            return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        return self._timelapse_image_impl(request, pk, filename)

    @action(
            detail=True, 
            methods=['get'], 
            url_path='admin-timelapse/download'
            )
    def download_admin(self, request, pk=None):
        user = request.user
        if not user.is_authenticated or not user.is_staff:
            return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        return self._download(request, pk)

    # Public proxy endpoint
    @action(
        detail=True,
        methods=['get'],
        url_path='originalImage',
        permission_classes=[AllowAny],
    )
    def original_image_public(self, request, pk=None):
        # forward to the real admin logic
        return self._original_image_impl(pk)

    @action(
        detail=True,
        methods=['get'],
        url_path='timelapse',
        permission_classes=[AllowAny],
    )
    def timelapse_public(self, request, pk=None):
        # forward to the real admin logic
        return self._timelapse_impl(pk)

    @action(
        detail=True,
        methods=['get'],
        url_path=r'timelapse/(?P<filename>[0-9]{14})',
        permission_classes=[AllowAny],
    )
    def timelapse_image_public(self, request, pk=None, filename=None):
        # forward to the real admin logic
        return self._timelapse_image_impl(request, pk, filename)

    @action(detail=True, methods=['get'], url_path='timelapse/download')
    def download_public(self, request, pk=None):
        # forward to the real admin logic
        return self._download(request, pk)  

    @action(
            detail=False, 
            methods=['get'], 
            url_path='staleAndDelayed',
            permission_classes=[AllowAny],
            )

    @staticmethod
    def is_stale(obj, now=None):
        now = now or timezone.now()
        std = obj.update_period_stddev or 0.0
        diff_seconds = (now - obj.last_update_modified).total_seconds()
        threshold = max(obj.update_period_mean * 1.1,
                        obj.update_period_mean + 2 * std)
        return diff_seconds > threshold

    @staticmethod
    def is_delayed(obj, now=None):
        now = now or timezone.now()
        std = obj.update_period_stddev or 0.0
        diff_seconds = (now - obj.last_update_modified).total_seconds()
        threshold = 2 * obj.update_period_mean + 2 * std
        return diff_seconds > threshold 

class WebcamTestViewSet(WebcamAPI, viewsets.ReadOnlyModelViewSet):
    pass