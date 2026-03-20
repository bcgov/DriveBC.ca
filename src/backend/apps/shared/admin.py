from apps.cms.models import DriveBCMapWidget
from apps.shared.models import Area, SiteSettings
from django.contrib.gis import admin


class SiteSettingsAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    gis_widget = DriveBCMapWidget


class AreaAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    gis_widget = DriveBCMapWidget


admin.site.register(Area, AreaAdmin)
admin.site.register(SiteSettings, SiteSettingsAdmin)
