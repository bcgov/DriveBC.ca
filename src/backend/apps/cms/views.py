from apps.cms.models import Advisory, Bulletin, EmergencyAlert
from apps.cms.serializers import (
    AdvisorySerializer,
    BulletinSerializer,
    BulletinTestSerializer,
    EmergencyAlertSerializer,
    EmergencyAlertTestSerializer,
)
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.http import HttpResponseRedirect
from django.shortcuts import render, reverse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets


class CMSViewSet(viewsets.ReadOnlyModelViewSet):
    def get_serializer_context(self):
        context = super().get_serializer_context()

        """Adds request to the context of serializer"""
        context['request'] = self.request

        return context
    
    def get_queryset(self):
        """
        For listing pages — show only published ones by default.
        """
        queryset = super().get_queryset()
        preview = self.request.query_params.get('preview')
        if preview == 'true':
            return queryset
        return queryset.filter(live=True)

    def get_object(self):
        """
        For single-item (detail) requests — handle ?preview=true properly.
        """
        obj = super().get_object()
        preview = self.request.query_params.get('preview')

        if preview == 'true':

            # Page not published yet, just return as-is
            if not obj.live:
                return obj

            # Page published but has a newer revision, return that revision
            latest_revision = obj.get_latest_revision()
            if latest_revision and latest_revision.created_at > obj.last_published_at:
                obj = latest_revision.as_object()

        return obj

class AdvisoryAPI(CachedListModelMixin, CMSViewSet):
    # Filter live=True so the cache only stores public data
    queryset = Advisory.objects.filter(live=True)
    serializer_class = AdvisorySerializer
    lookup_field = 'slug'
    cache_key = CacheKey.ADVISORY_LIST
    cache_timeout = CacheTimeout.ADVISORY_LIST


class BulletinTestAPI(CMSViewSet):
    queryset = Bulletin.objects.all()
    serializer_class = BulletinSerializer
    lookup_field = 'slug'


class BulletinAPI(CachedListModelMixin, BulletinTestAPI):
    # Filter live=True so the cache only stores public data
    queryset = Bulletin.objects.filter(live=True)
    serializer_class = BulletinSerializer
    cache_key = CacheKey.BULLETIN_LIST
    cache_timeout = CacheTimeout.BULLETIN_LIST


class EmergencyAlertTestAPI(CMSViewSet):
    queryset = EmergencyAlert.objects.filter(live=True)
    serializer_class = EmergencyAlertTestSerializer
    lookup_field = 'slug'


class EmergencyAlertAPI(CachedListModelMixin, EmergencyAlertTestAPI):
    queryset = EmergencyAlert.objects.filter(live=True)
    serializer_class = EmergencyAlertSerializer
    cache_key = CacheKey.EMERGENCY_ALERT_LIST
    cache_timeout = CacheTimeout.EMERGENCY_ALERT_LIST


@csrf_exempt
def access_requested(request):

    if request.method == 'POST':
        app = request.user._meta.app_label
        model = request.user._meta.model_name
        path = reverse(f'admin:{app}_{model}_change',  args=[request.user.id])
        url = settings.FRONTEND_BASE_URL + path[1:]
        first = request.user.first_name
        last = request.user.last_name
        name = f'{first} {last}'
        context = {
            'name': name,
            'email': request.user.email,
            'url': url
        }

        text = render_to_string('email/request_wagtail_access.txt', context)
        html = render_to_string('email/request_wagtail_access.html', context)

        msg = EmailMultiAlternatives(
            f'{name} requests access to Wagtail admin',
            text,
            settings.DRIVEBC_FROM_EMAIL_DEFAULT,
            settings.ACCESS_REQUEST_RECEIVERS,
        )
        msg.attach_alternative(html, 'text/html')
        msg.send()
        return HttpResponseRedirect(request.path)

    return render(request, 'wagtailadmin/access_requested.html')


def access_denied_idir(request):
    return render(request, 'wagtailadmin/access_denied.html', context={
        "is_non_idir_login": True,
    })
