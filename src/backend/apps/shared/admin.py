from apps.shared.models import Area, SiteSettings
from django.contrib.gis import admin


class SiteSettingsAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )


class AreaAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )


admin.site.register(Area, AreaAdmin)
admin.site.register(SiteSettings, SiteSettingsAdmin)
