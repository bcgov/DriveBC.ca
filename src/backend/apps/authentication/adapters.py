from django.conf import settings
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class AccountAdapter(DefaultAccountAdapter):
    ''' Governs accounts internally, for things like redirect urls. '''

    def get_login_redirect_url(self, request):
        return settings.FRONTEND_BASE_URL

    def get_logout_redirect_url(self, request):
        if request.path.startswith('/drivebc-'):
            return '/' + request.path.split('/')[1] + '/'
        return settings.FRONTEND_BASE_URL

