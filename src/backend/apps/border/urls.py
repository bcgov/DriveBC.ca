from apps.border import views as border_views
from django.urls import include, path
from rest_framework import routers

border_router = routers.DefaultRouter()
border_router.register(r"", border_views.BorderCrossingViewSet, basename="border_crossings")

urlpatterns = [
    path("", include(border_router.urls)),
]
