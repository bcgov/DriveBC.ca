from apps.shared import views as shared_views
from apps.shared.views import static_override
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path

urlpatterns = [
    # django
    path('drivebc-admin/', admin.site.urls),

    # apps
    path('api/', include("apps.shared.api")),

    # packages
    path('drivebc-cms/', include("apps.cms.urls")),

    # auth system
    path('accounts/', include('allauth.urls')),

    # misc
    path("healthcheck/", shared_views.health_check, name="health_check"),

    # TO BE REMOVED IN PRODUCTION
] + static_override(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEV_ENVIRONMENT:
    from django.views.static import serve
    urlpatterns.append(re_path(r"^images/(?P<path>.*)$", serve, {
        "document_root": f'{settings.SRC_DIR}/images/webcams',
    }))
