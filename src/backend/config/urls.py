from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # django
    path('drivebc-admin/', admin.site.urls),

    # apps
    path('api/', include("apps.shared.api")),

    # packages
]
