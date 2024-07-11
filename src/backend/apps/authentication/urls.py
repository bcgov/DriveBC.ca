from django.urls import include, path
from rest_framework import routers

from .views import FavouritedCamerasViewset, SavedRoutesViewset


router = routers.DefaultRouter()
router.register("webcams", FavouritedCamerasViewset)
router.register("routes", SavedRoutesViewset)

urlpatterns = [
    path("", include(router.urls))
]
