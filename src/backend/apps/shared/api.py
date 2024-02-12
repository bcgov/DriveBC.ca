from apps.cms.urls import cms_api_router, wagtail_api_router
from apps.shared import views
from django.urls import include, path

urlpatterns = [
    # App
    path("webcams/", include("apps.webcam.urls")),
    path("events/", include("apps.event.urls")),

    # Test
    path("test/", include("apps.shared.test_urls")),

    # CMS
    path("wagtail/", wagtail_api_router.urls),
    path("cms/", include(cms_api_router.urls)),

    # Others
    path("feedback/", views.FeedbackView.as_view(), name="feedback"),
]
