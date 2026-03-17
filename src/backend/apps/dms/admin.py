from apps.dms.models import Dms
from django.contrib.gis import admin


class DmsAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', 'message_display_1', 'message_display_2', 'message_display_3')

admin.site.register(Dms, DmsAdmin)
