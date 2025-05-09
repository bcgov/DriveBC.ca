import logging

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.contrib.auth.signals import user_logged_in
import requests

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


def store_id_token(sender, **kwargs):
    '''
    Call the keycloak API to refresh the user's access token so we have an
    id_token to use on logout (stored in the user's session).  Triggered on the
    `user_logged_in` hook.
    '''

    user = kwargs.get('user')
    request = kwargs.get('request')

    if request.session.get('_auth_user_backend') == 'django.contrib.auth.backends.ModelBackend':
        return

    try:
        account = user.socialaccount_set.first()
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
