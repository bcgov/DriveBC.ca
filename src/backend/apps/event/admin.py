from apps.authentication.models import EmailSubscription, SavedRoutes
from apps.cms.models import DriveBCMapWidget
from apps.event.models import (
    Event,
    QueuedDistrictEventNotification,
    QueuedEventNotification,
)
from apps.event.tasks import (
    get_event_state,
    send_queued_district_notifications,
    send_queued_notifications,
)
from django.contrib import messages
from django.contrib.gis import admin


def queue_and_send_event_notifications(request, previous_states, cleared=False):
    # test sends go to the admin user's first route, whether or not events are on it
    route = SavedRoutes.objects.filter(user=request.user).order_by('id').first()
    if route:
        for event_id, state in previous_states.items():
            QueuedEventNotification.objects.update_or_create(
                route_id=route.id, event_id=event_id, defaults={'previous_state': state, 'cleared': cleared},
            )
        send_queued_notifications(route_id=route.id, match_route=False)

    else:
        messages.warning(request, 'You have no saved route to send route notifications to.')

    # first area subscription, whether or not events are in its area
    subscription = EmailSubscription.objects.filter(user=request.user).order_by('id').first()
    if subscription:
        QueuedDistrictEventNotification.objects.update_or_create(
            subscription_id=subscription.id,
            defaults={
                'event_ids': list(previous_states),
                'previous_states': previous_states,
                'cleared_event_ids': list(previous_states) if cleared else [],
            },
        )

    else:
        messages.warning(request, 'You have no area subscription to send area notifications to.')

    send_queued_district_notifications()


@admin.action(description="Send event 'New' notifications")
def send_event_new_notifications(modeladmin, request, queryset):
    previous_states = {event.id: None for event in queryset}
    queue_and_send_event_notifications(request, previous_states)


@admin.action(description="Send event 'Updated' notifications")
def send_event_updated_notifications(modeladmin, request, queryset):
    previous_states = {}
    for event in queryset:
        state = get_event_state(event)
        # fake old highlight fields to test changes
        state['description'] = 'Old description'
        state['closest_landmark'] = 'Old landmark'
        previous_states[event.id] = state

    queue_and_send_event_notifications(request, previous_states)


@admin.action(description="Send event 'Cleared' notifications")
def send_event_cleared_notifications(modeladmin, request, queryset):
    previous_states = {event.id: get_event_state(event) for event in queryset}
    queue_and_send_event_notifications(request, previous_states, cleared=True)


class EventAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    actions = [
        send_event_new_notifications,
        send_event_updated_notifications,
        send_event_cleared_notifications,
    ]
    list_display = ('id', 'event_type', 'display_category',
                    'event_sub_type', 'severity', 'closed',
                    'first_created', 'last_updated')
    list_filter = ('status', 'event_type', 'display_category', 'event_sub_type',
                   'severity', 'closed', 'last_updated')
    gis_widget = DriveBCMapWidget


@admin.action(description="Send all queued event notifications")
def send_all_queued_event_notifications(modeladmin, request, queryset):
    send_queued_notifications()


class QueuedEventNotificationAdmin(admin.ModelAdmin):
    readonly_fields = ('id', 'created_at', 'modified_at')
    list_display = ('id', 'event_id', 'route_id', 'created_at')
    actions = [send_all_queued_event_notifications]


@admin.action(description="Send all queued district notifications")
def send_all_queued_district_notifications(modeladmin, request, queryset):
    send_queued_district_notifications()


class QueuedDistrictEventNotificationAdmin(admin.ModelAdmin):
    readonly_fields = ('id', 'created_at', 'modified_at')
    list_display = ('id', 'event_ids', 'subscription_id', 'created_at')
    actions = [send_all_queued_district_notifications]


admin.site.register(QueuedDistrictEventNotification, QueuedDistrictEventNotificationAdmin)
admin.site.register(QueuedEventNotification, QueuedEventNotificationAdmin)
admin.site.register(Event, EventAdmin)
