from apps.ferry.models import (
    CoastalFerryCalendar,
    CoastalFerryRoute,
    CoastalFerryStop,
    CoastalFerryStopTime,
    CoastalFerryTrip,
    Ferry,
)
from django.contrib.gis import admin


class FerryAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )


class CoastalFerryStopAdmin(admin.GISModelAdmin):
    list_display = ['id', 'name', 'parent_stop']
    readonly_fields = ('id', )


class CoastalFerryCalendarAdmin(admin.GISModelAdmin):
    list_display = ['id', 'name', 'schedule_start', 'schedule_end', 'active_week_days']
    readonly_fields = ('id', )


class CoastalFerryRouteAdmin(admin.GISModelAdmin):
    list_display = ['id', 'name', 'url']
    readonly_fields = ('id', )


class CoastalFerryTripAdmin(admin.GISModelAdmin):
    list_display = ['id', 'calendar', 'route']
    readonly_fields = ('id', )


class CoastalFerryStopTimeAdmin(admin.GISModelAdmin):
    list_display = ['id', 'trip', 'stop', 'stop_time', 'stop_sequence']
    readonly_fields = ('id', )


admin.site.register(Ferry, FerryAdmin)
admin.site.register(CoastalFerryStop, CoastalFerryStopAdmin)
admin.site.register(CoastalFerryCalendar, CoastalFerryCalendarAdmin)
admin.site.register(CoastalFerryRoute, CoastalFerryRouteAdmin)
admin.site.register(CoastalFerryTrip, CoastalFerryTripAdmin)
admin.site.register(CoastalFerryStopTime, CoastalFerryStopTimeAdmin)
