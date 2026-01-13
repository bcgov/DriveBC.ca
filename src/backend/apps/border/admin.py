from apps.border.models import BorderCrossing, BorderCrossingLanes
from django.contrib.gis import admin


class BorderCrossingAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )


class BorderCrossingLanesAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )


admin.site.register(BorderCrossing, BorderCrossingAdmin)
admin.site.register(BorderCrossingLanes, BorderCrossingLanesAdmin)
