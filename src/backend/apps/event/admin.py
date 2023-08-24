from apps.event.models import Event
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class EventAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(Event, EventAdmin)
