from apps.weather.models import RegionalCurrent
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class WeatherAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(RegionalCurrent, WeatherAdmin)

