from django.contrib import admin
from django.contrib.admin import ModelAdmin

from apps.shared.models import SiteSettings


class SiteSettingsAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(SiteSettings, SiteSettingsAdmin)
