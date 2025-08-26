from apps.shared.models import RouteGeometry
from apps.webcam.models import Webcam
from django.contrib import admin
from django.contrib.admin import ModelAdmin
import json
from apps.webcam.models import Webcam
from django.conf import settings


class WebcamAdmin(ModelAdmin):
    readonly_fields = ('id', )
    change_form_template = "admin/timelapse.html"  # custom template

    def change_view(self, request, object_id, form_url='', extra_context=None):
        webcam = self.get_object(request, object_id)
        extra_context = extra_context or {}
        extra_context['api_key'] = settings.TIMELAPSE_API_KEY

        if webcam:
            extra_context["image_paths"] = webcam.get_image_paths()
            extra_context["self"] = webcam

        return super().change_view(
            request, object_id, form_url, extra_context=extra_context
        )

    def render_change_form(self, request, context, add=False, change=False, form_url='', obj=None):
        if obj:
            image_paths = obj.get_image_paths()
            context['image_paths_json'] = json.dumps(image_paths)
            context['image_paths'] = image_paths
        return super().render_change_form(request, context, add, change, form_url, obj)


class RouteGeometryAdmin(ModelAdmin):
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
