from pathlib import Path

from apps.webcam.models import Webcam
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.db.utils import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import render, reverse
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..shared.helpers import attach_default_email_images
from .models import DriveBCUser, FavouritedCameras, SavedRoutes
from .serializers import (
    DriveBCUserSerializer,
    FavouritedCamerasSerializer,
    SavedRoutesSerializer,
)

# Backend dir and env
BACKEND_DIR = Path(__file__).resolve().parents[2]


def request_access(request):
    return render(request, "admin/request_access.html")


def access_requested(request):

    if request.method == 'POST':
        app = request.user._meta.app_label
        model = request.user._meta.model_name
        path = reverse(f'admin:{app}_{model}_change',  args=[request.user.id])
        url = settings.FRONTEND_BASE_URL + path[1:]
        first = request.user.first_name
        last = request.user.last_name
        name = f'{first} {last}'
        context = {'name': name, 'email': request.user.email, 'url': url, }

        text = render_to_string('email/request_admin_access.txt', context)
        html = render_to_string('email/request_admin_access.html', context)

        msg = EmailMultiAlternatives(
            f'{name} requests access to DriveBC admin',
            text,
            settings.DRIVEBC_FROM_EMAIL_DEFAULT,
            settings.ACCESS_REQUEST_RECEIVERS,
        )
        msg.attach_alternative(html, 'text/html')
        msg.send()
        return HttpResponseRedirect(request.path)

    return render(request, "admin/access_requested.html")


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
    r'''
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
        return self.request.user.routes.all().order_by('-created_at')


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    pass


class VerifyEmailView(APIView):
    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = DriveBCUser.objects.get(pk=uid)

        except (TypeError, ValueError, OverflowError, ObjectDoesNotExist):
            user = None

        if user is not None and EmailVerificationTokenGenerator().check_token(user, token):
            user.verified = True
            user.save()

            my_routes = request.GET.get('my_routes')
            redirect_url = settings.FRONTEND_BASE_URL + 'my-routes?verified=true' if my_routes == 'True'\
                else settings.FRONTEND_BASE_URL + 'account?verified=true'

            return HttpResponseRedirect(redirect_url)  # Redirect to the account page

        else:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class SendVerificationEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.verified:  # already verified, do nothing
            return Response({'message': 'Account already verified'}, status=status.HTTP_204_NO_CONTENT)

        # Start showing the reminder to verify the email
        if not user.attempted_verification:
            user.attempted_verification = True
            user.save()

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = EmailVerificationTokenGenerator().make_token(user)

        my_routes = request.data.get('my_routes', 'false')
        verification_url = request.build_absolute_uri(
            reverse('verify-email', kwargs={'uidb64': uid, 'token': token}) + f'?my_routes={my_routes}'
        )

        context = {
            'email': request.user.email,
            'verification_url': verification_url,
            'from_email': settings.DRIVEBC_FROM_EMAIL_DEFAULT
        }

        text = render_to_string('email/email_verification.txt', context)
        html = render_to_string('email/email_verification.html', context)

        msg = EmailMultiAlternatives(
            'Please verify your email address to setup email notifications',
            text,
            settings.DRIVEBC_FROM_EMAIL_DEFAULT,
            [request.user.email]
        )

        # image attachments
        attach_default_email_images(msg)

        msg.attach_alternative(html, 'text/html')
        msg.send()

        return Response({'message': 'Verification email sent'}, status=status.HTTP_200_OK)


class EmailConsentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.consent:  # already have consent, do nothing
            return Response({'status': status.HTTP_204_NO_CONTENT}, status=status.HTTP_204_NO_CONTENT)

        consent = request.data.get('consent', None)
        if consent:
            user.consent = True

        user.attempted_consent = True
        user.save()

        return Response({'status': status.HTTP_200_OK}, status=status.HTTP_200_OK)


class DriveBCUserViewset(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = DriveBCUser.objects.all()
    serializer_class = DriveBCUserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    lookup_field = 'username'

    def get_object(self):
        username = self.kwargs.get('username')
        return DriveBCUser.objects.get(username=username)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance != request.user:
            return Response({'error': 'You can only delete your own account'}, status=status.HTTP_403_FORBIDDEN)

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
