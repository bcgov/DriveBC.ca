from django.urls import include, path
from rest_framework import routers
from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.documents import urls as wagtaildocs_urls
from wagtail.documents.api.v2.views import DocumentsAPIViewSet
from wagtail.images.api.v2.views import ImagesAPIViewSet

from .views import FAQAPIViewSet

from .views import BulletinAPIViewSet
from .views import AdvisoryAPIViewSet

wagtail_api_router = WagtailAPIRouter('wagtailapi')
wagtail_api_router.register_endpoint('pages', PagesAPIViewSet)
wagtail_api_router.register_endpoint('images', ImagesAPIViewSet)
wagtail_api_router.register_endpoint('documents', DocumentsAPIViewSet)

cms_api_router = routers.DefaultRouter()
cms_api_router.register('faqs', FAQAPIViewSet)
cms_api_router.register('bulletins', BulletinAPIViewSet)
cms_api_router.register('advisories', AdvisoryAPIViewSet)


urlpatterns = [
    path('', include(wagtailadmin_urls)),
    path('documents', include(wagtaildocs_urls)),
    path('pages', include(wagtail_urls)),
]
