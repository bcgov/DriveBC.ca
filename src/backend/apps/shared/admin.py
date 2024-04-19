from apps.shared.models import SiteSettings
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class SiteSettingsAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(SiteSettings, SiteSettingsAdmin)
