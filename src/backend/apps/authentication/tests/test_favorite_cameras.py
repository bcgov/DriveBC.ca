import datetime
import zoneinfo

from apps.authentication.models import DriveBCUser, FavouritedCameras
from apps.webcam.models import Webcam
from django.contrib.gis.geos import Point
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITransactionTestCase


class FavouritedCamerasViewsetTests(APITransactionTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user = DriveBCUser.objects.create_user(username='testuser', password='testpassword')
        self.client.force_authenticate(user=self.user)
        self.webcam = Webcam.objects.create(
            id=8,
            # Description
            name="TestWebCam",
            caption="Webcam unit test",
            # Location
            region=6,
            region_name="Greater Van",
            highway="1C",
            highway_description="Some Highway",
            highway_group=3,
            highway_cam_order=23,
            location=Point(-123.569743, 48.561231),
            orientation="E",
            elevation=123,
            # General status
            is_on=True,
            should_appear=True,
            is_new=False,
            is_on_demand=False,
            # Update status
            marked_stale=False,
            marked_delayed=False,
            last_update_attempt=datetime.datetime(
                2023,
                6,
                2,
                16,
                42,
                16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver"),
            ),
            last_update_modified=datetime.datetime(
                2023,
                6,
                2,
                16,
                42,
                16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver"),
            ),
            update_period_mean=128,
            update_period_stddev=16,
        )

    def tearDown(self):
        super().tearDown()
        FavouritedCameras.objects.all().delete()

    def test_create_favourited_camera(self):
        url = reverse('favouritedcameras-list')
        data = {'webcam': self.webcam.id}
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert FavouritedCameras.objects.filter(user=self.user, webcam=self.webcam).exists()

        # Repeated call with same data should not create a new record
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert FavouritedCameras.objects.filter(user=self.user, webcam=self.webcam).count() == 1

    def test_create_favourited_camera_missing_webcam(self):
        url = reverse('favouritedcameras-list')
        response = self.client.post(url, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_favourited_camera_nonexistent_webcam(self):
        url = reverse('favouritedcameras-list')
        data = {'webcam': 999}
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_destroy_favourited_camera(self):
        FavouritedCameras.objects.create(user=self.user, webcam=self.webcam)
        assert FavouritedCameras.objects.filter(user=self.user, webcam=self.webcam).exists()

        url = reverse('favouritedcameras-detail', args=[self.webcam.id])
        response = self.client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not FavouritedCameras.objects.filter(user=self.user, webcam=self.webcam).exists()
