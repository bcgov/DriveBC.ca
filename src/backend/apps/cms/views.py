from apps.cms.models import Advisory, Bulletin, EmergencyAlert, EmergencyAlertDetail
from apps.cms.serializers import (
    AdvisorySerializer,
    BulletinSerializer,
    EmergencyAlertDetailSerializer,
    EmergencyAlertSerializer,
    EmergencyAlertTestSerializer,
)
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from django.conf import settings
from django.contrib import messages
from django.core.mail import EmailMultiAlternatives
from django.http import Http404, HttpResponseRedirect
from django.shortcuts import redirect, render, reverse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets
from wagtail.models import Page


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

                # Revision geometry may be stored as SRID=3857 (Web Mercator),
                # but the frontend expects SRID=4326 (WGS84) — normalize it.
                if obj.geometry and obj.geometry.srid != 4326:
                    obj.geometry.transform(4326)

        return obj


class AdvisoryAPI(CachedListModelMixin, CMSViewSet):
    queryset = Advisory.objects.all()
    serializer_class = AdvisorySerializer
    lookup_field = 'slug'
    cache_key = CacheKey.ADVISORY_LIST
    cache_timeout = CacheTimeout.ADVISORY_LIST


class BulletinTestAPI(CMSViewSet):
    queryset = Bulletin.objects.all()
    serializer_class = BulletinSerializer
    lookup_field = 'slug'


class BulletinAPI(CachedListModelMixin, BulletinTestAPI):
    queryset = Bulletin.objects.all()
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


class EmergencyAlertDetailTestAPI(CMSViewSet):
    queryset = EmergencyAlertDetail.objects.all()
    serializer_class = EmergencyAlertDetailSerializer
    lookup_field = 'slug'


class EmergencyAlertDetailAPI(CachedListModelMixin, EmergencyAlertDetailTestAPI):
    queryset = EmergencyAlertDetail.objects.all()
    serializer_class = EmergencyAlertDetailSerializer
    cache_key = CacheKey.EMERGENCY_ALERT_DETAIL_LIST
    cache_timeout = CacheTimeout.EMERGENCY_ALERT_DETAIL_LIST

    def get_queryset(self):
        return EmergencyAlertDetail.objects.filter(live=True)  # live only


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


def publish_minor_update(request, page_id):
    try:
        page_id = int(page_id)
    except (TypeError, ValueError):
        raise Http404()

    if request.method != "POST":
        return redirect(f"/drivebc-cms/pages/{page_id}/edit/")

    page = Page.objects.get(pk=page_id).specific

    if not isinstance(page, (Advisory, Bulletin)):
        messages.error(
            request,
            'Publish minor update is only available after publishing with notifications at least once.',
        )
        return redirect(f"/drivebc-cms/pages/{page_id}/edit/")

    # Prefer last notify time; fall back to last_published_at for legacy pages
    # published before last_notified_at existed.
    previous_last_notified_at = page.last_notified_at
    date_to_preserve = previous_last_notified_at or page.last_published_at

    if date_to_preserve is None:
        messages.error(
            request,
            'Publish minor update is only available after publishing with notifications at least once.',
        )
        return redirect(f"/drivebc-cms/pages/{page_id}/edit/")

    latest_revision = page.get_latest_revision()

    if latest_revision:
        # Publish the revision (updates content but triggers after_publish_page)
        latest_revision.publish(changed=False)

        # Keep "Updated" as the last notify (or prior publish for legacy pages).
        # Writing None here is what produced the 1969 dates on older content.
        Page.objects.filter(pk=page.pk).update(
            last_published_at=date_to_preserve
        )
        type(page).objects.filter(pk=page.pk).update(
            last_notified_at=previous_last_notified_at
        )

    messages.success(request, f'"{page.title}" published as a minor update.')
    return redirect(f"/drivebc-cms/pages/{page_id}/edit/")
