from apps.cms.models import Advisory, Bulletin
from apps.cms.tasks import send_advisory_notifications
from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin


@admin.action(description="Send route notifications")
def send_route_notifications(modeladmin, request, queryset):
    send_advisory_notifications(list(queryset.values_list('id', flat=True))[0])


class AdvisoryAdmin(OSMGeoAdmin):
    actions = [send_route_notifications]
    list_display = [
        'title', 'teaser', 'geometry', 'body',
        'created_at', 'modified_at'
    ]


class BulletinAdmin(OSMGeoAdmin):
    list_display = [
        'title', 'teaser', 'body',
        'created_at', 'modified_at'
    ]


admin.site.register(Advisory, AdvisoryAdmin)
admin.site.register(Bulletin, BulletinAdmin)
