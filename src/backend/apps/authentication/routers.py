from rest_framework import routers

from apps.authentication import views as auth_views

router = routers.DefaultRouter()
router.register(r'', auth_views.UserViewSet)
