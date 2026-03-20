from apps.cms.models import DriveBCMapWidget
from apps.rest.models import RestStop
from django.contrib.gis import admin


class RestStopAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    gis_widget = DriveBCMapWidget


admin.site.register(RestStop, RestStopAdmin)