from apps.dms import views as dms_views
from django.urls import include, path
from rest_framework import routers

dms_router = routers.DefaultRouter()
dms_router.register(r"", dms_views.DmsViewSet, basename="dms")

urlpatterns = [
    path('dms', dms_views.DmsViewSet.as_view({'get': 'dms'}), name='dms'),
    path('', include(dms_router.urls)),
]
