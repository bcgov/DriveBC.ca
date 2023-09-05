from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls

urlpatterns = [
    # django
    path('drivebc-admin/', admin.site.urls),

    # apps
    path('api/', include("apps.shared.api")),

    # packages
    path('drivebc-cms/', include(wagtailadmin_urls)),
    path('drivebc-documents/', include(wagtaildocs_urls)),
    path('drivebc-pages/', include(wagtail_urls)),
    path('drivebc-cms/', include("apps.cms.urls")),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


