import json

import pytz
from apps.shared.models import RouteGeometry
from apps.webcam.models import Webcam
from django.conf import settings
from django.contrib.gis import admin
from django.utils import timezone
from timezonefinder import TimezoneFinder


class WebcamAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    change_form_template = "admin/timelapse.html"  # custom template

    def change_view(self, request, object_id, form_url='', extra_context=None):
        webcam = self.get_object(request, object_id)
        extra_context = extra_context or {}
        extra_context["image_paths"] = webcam.get_image_paths()
        extra_context["self"] = webcam
        extra_context['FRONTEND_BASE_URL'] = settings.FRONTEND_BASE_URL

        if webcam and webcam.location:
            lat, lon = webcam.location.y, webcam.location.x
            tz_name = TimezoneFinder().timezone_at(lat=lat, lng=lon) or "UTC"
            tz = pytz.timezone(tz_name)
            now_local = timezone.now().astimezone(tz)

            extra_context["timezone"] = tz_name
            extra_context["default_start_date"] = now_local.date().isoformat()
            extra_context["default_start_time"] = now_local.strftime("%H:%M")
            extra_context["default_end_date"] = now_local.date().isoformat()
            extra_context["default_end_time"] = "23:59"

        return super().change_view(request, object_id, form_url, extra_context=extra_context)

    def render_change_form(self, request, context, add=False, change=False, form_url='', obj=None):
        if obj:
            image_paths = obj.get_image_paths()
            context['image_paths_json'] = json.dumps(image_paths)
            context['image_paths'] = image_paths
        return super().render_change_form(request, context, add, change, form_url, obj)


class RouteGeometryAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    change_form_template = "admin/timelapse.html"  # custom template

    def change_view(self, request, object_id, form_url='', extra_context=None):
        webcam = self.get_object(request, object_id)
        extra_context = extra_context or {}

        if webcam:
            extra_context["image_paths"] = webcam.get_image_paths()

        return super().change_view(
            request, object_id, form_url, extra_context=extra_context
        )

    def render_change_form(self, request, context, add=False, change=False, form_url='', obj=None):
        if obj:
            image_paths = obj.get_image_paths()
            context['image_paths_json'] = json.dumps(image_paths)
            context['image_paths'] = image_paths
        return super().render_change_form(request, context, add, change, form_url, obj)


admin.site.register(Webcam, WebcamAdmin)
admin.site.register(RouteGeometry, RouteGeometryAdmin)
