from apps.ferry import views as ferry_views
from django.urls import include, path
from rest_framework import routers

ferry_router = routers.DefaultRouter()
ferry_router.register(r"", ferry_views.FerryViewSet, basename="ferries")

coastal_router = routers.DefaultRouter()
coastal_router.register(r"", ferry_views.CoastalViewSet, basename="coastal-ferries")

urlpatterns = [
    path("", include(ferry_router.urls)),
    path("coastal", include(coastal_router.urls)),
]
