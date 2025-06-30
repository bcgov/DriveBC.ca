from apps.shared import views as shared_views
from django.urls import include, path
from rest_framework import routers

district_router = routers.DefaultRouter()
district_router.register(r"", shared_views.DistrictViewSet, basename="districts")

urlpatterns = [
    path("", include(district_router.urls)),
]
