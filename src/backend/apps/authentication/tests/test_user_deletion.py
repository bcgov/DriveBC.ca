from apps.authentication.models import DriveBCUser
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


class DriveBCUserViewsetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = DriveBCUser.objects.create_user(username='testuser', password='testpassword')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('drivebcuser-detail', args=[self.user.username])

    def test_delete_own_account(self):
        response = self.client.delete(self.url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not DriveBCUser.objects.filter(username='testuser').exists()

    def test_delete_other_user_account(self):
        other_user = DriveBCUser.objects.create_user(username='otheruser', password='otherpassword')
        url = reverse('drivebcuser-detail', args=[other_user.username])
        response = self.client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert DriveBCUser.objects.filter(username='otheruser').exists()

    def test_delete_unauthenticated(self):
        self.client.logout()
        response = self.client.delete(self.url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert DriveBCUser.objects.filter(username='testuser').exists()
