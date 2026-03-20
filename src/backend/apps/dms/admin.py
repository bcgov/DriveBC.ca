from apps.cms.models import DriveBCMapWidget
from apps.dms.models import Dms
from django.contrib.gis import admin


class DmsAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    gis_widget = DriveBCMapWidget

admin.site.register(Dms, DmsAdmin)
