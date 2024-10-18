from apps.weather.models import CurrentWeather, RegionalWeather, HighElevationForecast
from django.contrib import admin
from django.contrib.admin import ModelAdmin


class WeatherAdmin(ModelAdmin):
    readonly_fields = ('id', )

class HefAdmin(ModelAdmin):
    readonly_fields = ('code', )

admin.site.register(RegionalWeather, WeatherAdmin)
admin.site.register(CurrentWeather, WeatherAdmin)
admin.site.register(HighElevationForecast, HefAdmin)
