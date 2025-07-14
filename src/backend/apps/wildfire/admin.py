from apps.wildfire.models import Wildfire
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class WildfireAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(Wildfire, WildfireAdmin)
