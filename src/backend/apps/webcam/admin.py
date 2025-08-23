from apps.shared.models import RouteGeometry
from apps.webcam.models import Webcam
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class WebcamAdmin(ModelAdmin):
    readonly_fields = ('id', )


class RouteGeometryAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(Webcam, WebcamAdmin)
admin.site.register(RouteGeometry, RouteGeometryAdmin)
