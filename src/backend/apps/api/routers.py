from rest_framework import routers

from apps.authentication import views as auth_views

from django.urls import include, path

from .route_planner import urls as route_planner_urls

router = routers.DefaultRouter()
router.register(r'test', auth_views.UserViewSet)

urlpatterns = [
    path("", include(route_planner_urls)),
]
