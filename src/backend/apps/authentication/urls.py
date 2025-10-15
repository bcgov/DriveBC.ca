from django.urls import include, path
from rest_framework import routers

from .views import (
    DriveBCUserViewset,
    EmailConsentView,
    FavouritedCamerasViewset,
    SavedRoutesViewset,
    SendVerificationEmailView,
    VerifyEmailView,
)

router = routers.DefaultRouter()
router.register("webcams", FavouritedCamerasViewset)
router.register("routes", SavedRoutesViewset)
router.register("drivebcuser", DriveBCUserViewset)

urlpatterns = [
    path("", include(router.urls)),
    path('verify-email/<uidb64>/<token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('send-verification-email/', SendVerificationEmailView.as_view(), name='send-verification-email'),
    path('email-consent/', EmailConsentView.as_view(), name='email-consent'),
]
