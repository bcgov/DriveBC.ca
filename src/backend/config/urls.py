from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # django
    path('drivebc-admin/', admin.site.urls),

    # apps
    path('api/', include("apps.shared.api")),

    # packages
    path('drivebc-cms/', include("apps.cms.urls")),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
