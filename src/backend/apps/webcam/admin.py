from django.contrib import admin
from django.contrib.admin import ModelAdmin

from apps.webcam.models import Webcam


class WebcamAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(Webcam, WebcamAdmin)
