from apps.event.models import Event
from apps.event.tasks import send_event_notifications
from django.contrib import admin
from django.contrib.admin import ModelAdmin


@admin.action(description="Send route notifications")
def send_route_notifications(modeladmin, request, queryset):
    send_event_notifications(list(queryset.values_list('id', flat=True)))


class EventAdmin(ModelAdmin):
    readonly_fields = ('id', )
    actions = [send_route_notifications]
    list_display = ('id', 'event_type', 'display_category',
                    'event_sub_type', 'severity', 'closed',
                    'first_created', 'last_updated')


admin.site.register(Event, EventAdmin)
