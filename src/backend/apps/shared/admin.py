from apps.shared.models import Area, SiteSettings
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class SiteSettingsAdmin(ModelAdmin):
    readonly_fields = ('id', )


class AreaAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(Area, AreaAdmin)
admin.site.register(SiteSettings, SiteSettingsAdmin)
