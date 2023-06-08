from django.urls import include, path
from rest_framework import routers

from apps.authentication import views as auth_views


user_router = routers.DefaultRouter()
user_router.register(r'', auth_views.UserViewSet, basename='users')

urlpatterns = [
    path('v1/', include((user_router.urls, 'v1'), namespace='v1')),
]
