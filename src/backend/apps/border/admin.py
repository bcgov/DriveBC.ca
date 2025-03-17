from apps.border.models import BorderCrossing, BorderCrossingLanes
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class BorderCrossingAdmin(ModelAdmin):
    readonly_fields = ('id', )


class BorderCrossingLanesAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(BorderCrossing, BorderCrossingAdmin)
admin.site.register(BorderCrossingLanes, BorderCrossingLanesAdmin)
