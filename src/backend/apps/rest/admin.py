from apps.rest.models import RestStop
from django.contrib.gis import admin


class RestStopAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )


admin.site.register(RestStop, RestStopAdmin)