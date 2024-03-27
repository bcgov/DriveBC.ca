from apps.rest import views as rest_stop_views
from django.urls import include, path
from rest_framework import routers

rest_stop_router = routers.DefaultRouter()
rest_stop_router.register(r"", rest_stop_views.RestStopViewSet, basename="reststop")

urlpatterns = [
    path('reststop', rest_stop_views.RestStopViewSet.as_view({'get': 'reststop'}), name='reststop'),
    path('', include(rest_stop_router.urls)),
]
