from apps.cms.urls import cms_api_router, wagtail_api_router
from apps.shared import views
from django.urls import include, path

from .views import session

urlpatterns = [
    # Feed
    path("webcams/", include("apps.webcam.urls")),
    path("events/", include("apps.event.urls")),
    path("weather/", include("apps.weather.urls")),
    path("ferries/", include("apps.ferry.urls")),
    path("reststops/", include("apps.rest.urls")),

    # CMS
    path("wagtail/", wagtail_api_router.urls),
    path("cms/", include(cms_api_router.urls)),

    # Users
    path("users/", include("apps.authentication.urls")),

    # Misc
    path("feedback/", views.FeedbackView.as_view(), name="feedback"),
    path("session", session.as_view()),
    path("test/", include("apps.shared.test_urls")),
]
