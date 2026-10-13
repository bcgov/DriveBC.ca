from apps.cms.models import Advisory, Bulletin, DriveBCMapWidget
from apps.cms.tasks import send_advisory_notifications
from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin


@admin.action(description="Send advisory notifications")
def send_advisory_notifications_action(modeladmin, request, queryset):
    send_advisory_notifications(next(iter(queryset.values_list('id', flat=True))))


class AdvisoryAdmin(GISModelAdmin):
    actions = [send_advisory_notifications_action]
    list_display = [
        'title', 'teaser', 'geometry', 'body',
        'created_at', 'modified_at'
    ]
    gis_widget = DriveBCMapWidget


class BulletinAdmin(GISModelAdmin):
    list_display = [
        'title', 'teaser', 'body',
        'created_at', 'modified_at'
    ]
    gis_widget = DriveBCMapWidget


admin.site.register(Advisory, AdvisoryAdmin)
admin.site.register(Bulletin, BulletinAdmin)
