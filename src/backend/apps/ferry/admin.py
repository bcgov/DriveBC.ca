from apps.ferry.models import Ferry
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class FerryAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(Ferry, FerryAdmin)
