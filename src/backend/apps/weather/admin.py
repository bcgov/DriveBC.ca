from apps.weather.models import CurrentWeather, RegionalWeather
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class WeatherAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(RegionalWeather, WeatherAdmin)
admin.site.register(CurrentWeather, WeatherAdmin)
