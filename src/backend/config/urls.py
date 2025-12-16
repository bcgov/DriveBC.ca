import os

from allauth.account import views
from allauth.account.decorators import secure_admin_login
from apps.authentication import views as auth_views
from apps.shared import views as shared_views
from apps.shared.views import static_override
from debug_toolbar.toolbar import debug_toolbar_urls
from django.conf import settings
from django.conf.urls import defaults
from django.conf.urls.static import static
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def admin_permission_denied_handler(request, exception):
    '''
    If IDIR use is required, authenicated IDIR accounts get the request
    access page; other requests get app specific denial page.
    '''
    if settings.FORCE_IDIR_AUTHENTICATION and request.user.username.endswith('azureidir'):
        return redirect('admin-request-access')

    return defaults.permission_denied(request, exception,
                                      template_name='admin/access_denied.html')


def cms_permission_denied_handler(request, exception):
    '''
    If IDIR use is required, authenicated IDIR accounts get the request
    access page; other requests get app specific denial page.
    '''
    if settings.FORCE_IDIR_AUTHENTICATION and request.user.username.endswith('azureidir'):
        return redirect('admin-request-access')

    return defaults.permission_denied(request, exception,
                                      template_name='wagtail_admin/access_denied.html')


def permission_denied_handler(request, exception):
    ''' Special handler to redirect users for admin/cms to a 'request access' page '''

    if request.path.startswith('/drivebc-admin/'):
        return admin_permission_denied_handler(request, exception)
    elif request.path.startswith('/drivebc-cms/'):
        return cms_permission_denied_handler(request, exception)

    return defaults.permission_denied(request, exception)


admin.autodiscover()

if settings.FORCE_IDIR_AUTHENTICATION:
    admin.site.login = secure_admin_login(admin.site.login)
    admin.site.logout = views.logout
    handler403 = permission_denied_handler


urlpatterns = [
    # django
    path('drivebc-admin/request-access', auth_views.request_access, name='admin-request-access'),
    path('drivebc-admin/access-requested', auth_views.access_requested, name='admin-access-requested'),
    path('drivebc-admin/', admin.site.urls),

    # apps
    path('api/', include("apps.shared.api")),

    # packages
    path('drivebc-cms/', include("apps.cms.urls")),

    # auth system
    path('accounts/', include('allauth.urls')),

    # misc
    path("healthcheck/", shared_views.health_check, name="health_check"),

    # Webcam-only schema/docs
    path(
        "api/schema/",
        SpectacularAPIView.as_view(urlconf="apps.webcam.schema_urls"),
        name="api-schema",
    ),
    path(
        "api/swagger/",
        SpectacularSwaggerView.as_view(url_name="api-schema"),
        name="api-swagger",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="api-schema"),
        name="api-redoc",
    ),

    # Actual webcam endpoints
    path("api/webcams/", include("apps.webcam.urls")),

] + debug_toolbar_urls() + static_override(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


if settings.DEV_ENVIRONMENT:
    from django.views.static import serve
    urlpatterns.append(re_path(r"^images/(?P<path>.*)$", serve, {
        "document_root": f'{settings.SRC_DIR}/images/webcams',
    }))

else:
    # Serve images/webcams from /app/images
    urlpatterns += static(
        '/images/',
        document_root=os.path.join(settings.BASE_DIR, 'app', 'images')
    )
