from apps.rest.models import RestStop
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class RestStopAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(RestStop, RestStopAdmin)