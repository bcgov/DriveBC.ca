from apps.cms.models import Advisory, Bulletin, EmergencyAlert
from apps.cms.serializers import (
    AdvisorySerializer,
    BulletinSerializer,
    BulletinTestSerializer,
    EmergencyAlertSerializer,
    EmergencyAlertTestSerializer,
)
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


class AdvisoryAPI(CMSViewSet):
    queryset = Advisory.objects.filter(live=True)
    serializer_class = AdvisorySerializer
    # cache_key = CacheKey.ADVISORY_LIST
    # cache_timeout = CacheTimeout.DEFAULT
    lookup_field = 'slug'


class BulletinTestAPI(CMSViewSet):
    queryset = Bulletin.objects.filter(live=True)
    serializer_class = BulletinTestSerializer
    # cache_key = CacheKey.BULLETIN_LIST
    # cache_timeout = CacheTimeout.DEFAULT
    lookup_field = 'slug'


class BulletinAPI(BulletinTestAPI):
    serializer_class = BulletinSerializer


class EmergencyAlertTestAPI(CMSViewSet):
    queryset = EmergencyAlert.objects.filter(live=True)
    serializer_class = EmergencyAlertTestSerializer
    lookup_field = 'slug'


class EmergencyAlertAPI(EmergencyAlertTestAPI):
    serializer_class = EmergencyAlertSerializer


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
