from apps.authentication.models import DriveBCUser, SavedRoutes
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITransactionTestCase


class SavedRoutesViewsetTests(APITransactionTestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = DriveBCUser.objects.create_user(username='testuser', password='testpassword')
        self.client.force_authenticate(user=self.user)
        self.route_data = {
            'label': 'Test Route',
            'distance': 10.0,
            'distance_unit': 'km',
            'start': 'Start Point',
            'end': 'End Point',
            'start_point': 'POINT(0 0)',
            'end_point': 'POINT(1 1)',
            'thumbnail': '',
            'route': 'MULTILINESTRING((0 0, 1 1))'
        }

    def tearDown(self):
        super().tearDown()
        SavedRoutes.objects.all().delete()

    def test_create_saved_route(self):
        url = reverse('savedroutes-list')
        response = self.client.post(url, self.route_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert SavedRoutes.objects.filter(user=self.user, label='Test Route').exists()

    def test_list_saved_routes(self):
        SavedRoutes.objects.create(user=self.user, **self.route_data)
        url = reverse('savedroutes-list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_delete_saved_route(self):
        saved_route = SavedRoutes.objects.create(user=self.user, **self.route_data)
        assert SavedRoutes.objects.filter(id=saved_route.id).exists()
        url = reverse('savedroutes-detail', args=[saved_route.id])
        response = self.client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not SavedRoutes.objects.filter(id=saved_route.id).exists()
