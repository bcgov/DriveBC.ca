import logging

import requests
from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.signals import user_logged_in
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from apps.authentication.models import DriveBCUser
from django.conf import settings

logger = logging.getLogger(__name__)


class AccountAdapter(DefaultAccountAdapter):
    ''' Governs accounts internally, for things like redirect urls. '''
    def get_login_redirect_url(self, request):
        return settings.FRONTEND_BASE_URL

    def get_logout_redirect_url(self, request):
        redirect_url = settings.FRONTEND_BASE_URL

        # for admin and cms, return users to root admin/cms page
        if request.path.startswith('/drivebc-'):
            path = request.path.split('/')[1] + '/'

            # in local dev, admin/cms are coming directly from django
            if 'localhost' in redirect_url:
                redirect_url = 'http://localhost:8000/' + path
            else:
                redirect_url += path

        url = f'{settings.KEYCLOAK_URL}/protocol/openid-connect/logout'

        token = request.session.get('id_token')
        if token:
            url = f'{url}?post_logout_redirect_uri={redirect_url}&id_token_hint={token}'
            # without the token and redirect_uri, user is logged out and ends on
            # keycloak "you have signed out" page

        return url


class SocialAdapter(DefaultSocialAccountAdapter):
    ''' Hooks specific to social logins like BCeID and OTP '''
    def update_verified_consent_status(self, sociallogin, request=None):
        email = sociallogin.account.extra_data['email'].lower()  # ignore cases
        user = DriveBCUser.objects.filter(email=email).first()
        if user:
            # connect new social logins to the existing user
            # https://github.com/pennersr/django-allauth/issues/418
            if request:
                sociallogin.connect(request, user)

            # update verified/consent status for existing user
            is_otp = sociallogin.account.provider == 'otp'

            # Logged in through OTP, mark user as verified
            if is_otp:
                if not user.verified:
                    user.verified = True
                    user.attempted_verification = True
                    user.save()

            # Logged in through BCeID, mark user as having given consent
            else:
                if not user.consent:
                    user.consent = True
                    user.attempted_consent = True
                    user.save()

    def pre_social_login(self, request, sociallogin):
        self.update_verified_consent_status(sociallogin, request)

    def save_user(self, request, sociallogin, form=None):
        dbc_user = super().save_user(request, sociallogin, form)
        self.update_verified_consent_status(sociallogin)
        return dbc_user


def store_id_token(sender, **kwargs):
    '''
    Call the keycloak API to refresh the user's access token so we have an
    id_token to use on logout (stored in the user's session).  Triggered on the
    `user_logged_in` hook.
    '''

    request = kwargs.get('request')
    if request.session.get('_auth_user_backend') == 'django.contrib.auth.backends.ModelBackend':
        return

    try:
        account = kwargs.get('sociallogin').account
        token = account.socialtoken_set.first()
        res = requests.post(
            f'{settings.KEYCLOAK_URL}/protocol/openid-connect/token',
            data={
                'grant_type': 'refresh_token',
                'client_id': settings.KEYCLOAK_CLIENT_ID,
                'client_secret': settings.KEYCLOAK_SECRET,
                'refresh_token': token.token_secret,
            }
        )
        data = res.json()
        token.token = data.get('access_token')
        token.token_secret = data.get('refresh_token')
        token.save()
        request.session['id_token'] = data.get('id_token')

    except Exception as e:
        # failure to store id_token not fatal to logging in
        logger.exception(e)


user_logged_in.connect(store_id_token, weak=False)
