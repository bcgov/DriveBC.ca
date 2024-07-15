from apps.webcam.models import Webcam
from django.db.utils import IntegrityError
from rest_framework import permissions, status, viewsets
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.response import Response

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
            return Response({'detail': 'Webcam not found'},
                            status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            pass  # record already exists, so success by idempotency

        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, pk=None):
        # if cam not found, success by idempotency, don't signal error
        self.get_queryset().filter(webcam_id=int(pk)).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedRoutesViewset(viewsets.ModelViewSet):
    '''
    This viewset provides for listing, adding, and removing saved routes for the
    authenticated user.  Unauthenticated users will receive a 403 response.

    **GET /api/users/routes/**

    Returns a list of saved routes for the authenticated user.  See the POST
    documentation below for the structure of a saved route.

    **POST /api/users/routes/**

    Creates a new saved route for the user.  There is currently no checking for
    duplication in routes; the same route submitted twice will create two
    entries in the list for the user.

    Returns the saved route with a 201 status code, including the ID of the
    record.

        {
            "label": <user provided string naming the route>,
            "distance": <float value of route length, returned by the router API>,
            "distance_unit": <string value of unit; should be 'km', returned by the router API>
            "start": <the search term used to start the route>,
            "end": <the search term for the destination>,
            "start_point": <the GeoJSON point for the start, returned by the router API>,
            "end_point": <the GeoJSON point for the destination, returned by the router API>,
            "thumbnail": <image data in data URI form, may be blank>,
            "route": <The GeoJSON MultiLineString for the route, returned by the router API>
        }

    **DELETE /api/users/routes/*<id\>*/**

    Removes the route from the user's list, deleting it from the database.
    *<id\>* is the ID of the route record, returned in the list.

    **PUT /api/users/routes/*<id\>*/**

    Updates the route identified by *<id\>*.  Requires entire object to be sent.

    **PATCH /api/users/routes/*<id\>*/**

    Updates the route identified by *<id\>*.  Partial update is allowed, sending
    only those fields with changing values.
    '''

    queryset = SavedRoutes.objects.all()
    serializer_class = SavedRoutesSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication, BasicAuthentication]

    def get_queryset(self):
        return self.request.user.routes.all()
