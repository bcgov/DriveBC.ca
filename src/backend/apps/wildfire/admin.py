from apps.wildfire.models import Wildfire
from django.contrib.gis import admin


class WildfireAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )


admin.site.register(Wildfire, WildfireAdmin)
