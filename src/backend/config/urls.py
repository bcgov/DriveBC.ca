from allauth.account.decorators import secure_admin_login
from django.conf import settings
from django.conf.urls import handler403, defaults
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path, re_path

from apps.authentication import views as auth_views
from apps.shared import views as shared_views
from apps.shared.views import static_override


def permission_denied_handler(request, exception):
    if request.user.is_authenticated and request.path.startswith('/drivebc-admin/'):
        return redirect('admin-request-access')

    return defaults.permission_denied(request, exception)


if settings.FORCE_IDIR_AUTHENTICATION:
    admin.autodiscover()
    admin.site.login = secure_admin_login(admin.site.login)
    handler403 = permission_denied_handler


urlpatterns = [
    # django
    path('drivebc-admin/request-access', auth_views.request_access, name='admin-request-access'),
    path('drivebc-admin/', admin.site.urls),

    # apps
    path('api/', include("apps.shared.api")),

    # packages
    path('drivebc-cms/', include("apps.cms.urls")),

    # auth system
    path('accounts/', include('allauth.urls')),
    # path('accounts/', include("apps.authentication.urls")),

    # misc
    path("healthcheck/", shared_views.health_check, name="health_check"),

    # TO BE REMOVED IN PRODUCTION
] + static_override(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEV_ENVIRONMENT:
    from django.views.static import serve
    urlpatterns.append(re_path(r"^images/(?P<path>.*)$", serve, {
        "document_root": f'{settings.SRC_DIR}/images/webcams',
    }))
