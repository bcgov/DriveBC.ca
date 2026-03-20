from apps.cms.models import DriveBCMapWidget
from apps.wildfire.models import Wildfire
from django.contrib.gis import admin


class WildfireAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    gis_widget = DriveBCMapWidget


admin.site.register(Wildfire, WildfireAdmin)
