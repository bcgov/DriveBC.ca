from django.urls import include, path

from apps.authentication.routers import router as user_router

urlpatterns = [
    path('user/', include(user_router.urls)),
]
