from apps.dms.models import Dms
from django.contrib.gis import admin


class DmsAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )

admin.site.register(Dms, DmsAdmin)
