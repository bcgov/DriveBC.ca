from apps.event.models import Event, QueuedEventNotification
from apps.event.tasks import queue_event_notifications
from django.contrib.gis import admin


@admin.action(description="Send route notifications")
def queue_route_notifications(modeladmin, request, queryset):
    queue_event_notifications(list(queryset.values_list('id', flat=True)))


class EventAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    actions = [queue_route_notifications]
    list_display = ('id', 'event_type', 'display_category',
                    'event_sub_type', 'severity', 'closed',
                    'first_created', 'last_updated')


class QueuedEventNotificationAdmin(admin.ModelAdmin):
    readonly_fields = ('id', 'created_at', 'modified_at')
    list_display = ('id', 'event_id', 'route_id', 'created_at')


admin.site.register(QueuedEventNotification, QueuedEventNotificationAdmin)
admin.site.register(Event, EventAdmin)
