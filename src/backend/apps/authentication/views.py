from django.db.utils import IntegrityError
from rest_framework import viewsets, permissions, status
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.response import Response

from apps.webcam.models import Webcam

from .models import FavouritedCameras, SavedRoutes
from .serializers import FavouritedCamerasSerializer, SavedRoutesSerializer


class FavouritedCamerasViewset(viewsets.ModelViewSet):
    queryset = FavouritedCameras.objects.all()
    serializer_class = FavouritedCamerasSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication, BasicAuthentication]

    def get_queryset(self):
        return self.request.user.webcams.all()

    def create(self, request):
        if 'webcam' not in request.data:
            return Response('Required argument "webcam" not provided',
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            webcam = Webcam.objects.get(id=request.data.get('webcam'))
            FavouritedCameras.objects.create(user=request.user, webcam=webcam)
        except Webcam.DoesNotExist:
            return Response({ 'detail': 'Webcam not found' },
                            status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            pass  # record already exists, so success by idempotency

        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, pk=None):
        # if cam not found, success by idempotency, don't signal error
        self.get_queryset().filter(webcam=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedRoutesViewset(viewsets.ModelViewSet):
    queryset = SavedRoutes.objects.all()
    serializer_class = SavedRoutesSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication, BasicAuthentication]

    def get_queryset(self):
        return self.request.user.routes.all()
