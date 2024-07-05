from django.urls import include, path
from rest_framework import routers

from .views import FavouritedCamerasViewset


router = routers.DefaultRouter()
router.register("webcams", FavouritedCamerasViewset)

urlpatterns = [
    path("", include(router.urls))
]
