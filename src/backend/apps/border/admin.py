from apps.cms.models import DriveBCMapWidget
from apps.border.models import BorderCrossing, BorderCrossingLanes
from django.contrib.gis import admin


class BorderCrossingAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    gis_widget = DriveBCMapWidget


class BorderCrossingLanesAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    gis_widget = DriveBCMapWidget


admin.site.register(BorderCrossing, BorderCrossingAdmin)
admin.site.register(BorderCrossingLanes, BorderCrossingLanesAdmin)
