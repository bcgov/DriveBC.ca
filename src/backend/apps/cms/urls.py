from allauth.account.decorators import secure_admin_login
from allauth.account.views import LogoutView as AllauthLogoutView
from django.conf import settings
from django.shortcuts import redirect
from django.urls import include, path
from rest_framework import routers
from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.admin.auth import reject_request
from wagtail.admin.views.account import LoginView
from wagtail.admin.views.account import LogoutView as WagtailLogoutView
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.documents import urls as wagtaildocs_urls
from wagtail.documents.api.v2.views import DocumentsAPIViewSet
from wagtail.images.api.v2.views import ImagesAPIViewSet
from wagtail.utils.urlpatterns import decorate_urlpatterns

from .views import AdvisoryAPI, BulletinAPI, EmergencyAlertAPI, access_denied_idir

wagtail_api_router = WagtailAPIRouter('wagtailapi')
wagtail_api_router.register_endpoint('pages', PagesAPIViewSet)
wagtail_api_router.register_endpoint('images', ImagesAPIViewSet)
wagtail_api_router.register_endpoint('documents', DocumentsAPIViewSet)

cms_api_router = routers.DefaultRouter()
cms_api_router.register('advisories', AdvisoryAPI)
cms_api_router.register('bulletins', BulletinAPI)
cms_api_router.register('emergency-alert', EmergencyAlertAPI)


def require_idir_auth(view_func):
    def decorated_view(request, *args, **kwargs):
        user = request.user

        if user.is_anonymous:
            return reject_request(request)

        if user.username.endswith('azureidir'):
            return view_func(request, *args, **kwargs)

        return redirect("cms_denied_idir")

    return decorated_view


if settings.FORCE_IDIR_AUTHENTICATION:
    login_view = secure_admin_login(LoginView.as_view())
    logout_view = AllauthLogoutView.as_view()
    decorate_urlpatterns(wagtailadmin_urls.urlpatterns, require_idir_auth)
else:
    login_view = LoginView.as_view()
    logout_view = WagtailLogoutView.as_view()


urlpatterns = [
    path("login/", login_view, name="cms_login"),
    path("logout/", logout_view, name="cms_logout"),
    path("denied", access_denied_idir, name="cms_denied_idir"),
    path('', include(wagtailadmin_urls)),
    path('documents/', include(wagtaildocs_urls)),
    path('pages/', include(wagtail_urls)),
]
