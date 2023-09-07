from apps.cms.models import TestCMSData
from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin


class FAQAdmin(OSMGeoAdmin):
    list_display = [
        'id', 'name', 'body',
        'order', 'active', 'email',
        'url', 'location_geometry',
        'created_at', 'modified_at'
    ]


admin.site.register(TestCMSData, FAQAdmin)
