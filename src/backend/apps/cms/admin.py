from apps.cms.models import Advisory
from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin


class AdvisoryAdmin(OSMGeoAdmin):
    list_display = [
        'title', 'active', 'description', 'geometry',
        'created_at', 'modified_at'
    ]


admin.site.register(Advisory, AdvisoryAdmin)
