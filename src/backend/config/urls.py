from django.contrib import admin
from django.urls import include, path

from apps.shared import views as shared_views
from apps.api.routers import router as default_router

urlpatterns = [
    # apps
    path('', shared_views.homepage),
    path('api/', include("apps.api.routers")),

    # packages
    path('admin/', admin.site.urls),
    path('rest-auth/', include('dj_rest_auth.urls')),
    path('rest-auth/registration/', include('dj_rest_auth.registration.urls'))
]
