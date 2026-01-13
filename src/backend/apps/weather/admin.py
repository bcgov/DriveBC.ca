from apps.weather.models import CurrentWeather, RegionalWeather, HighElevationForecast
from django.contrib.gis import admin


class WeatherAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )

class HefAdmin(admin.GISModelAdmin):
    readonly_fields = ('code', )

admin.site.register(RegionalWeather, WeatherAdmin)
admin.site.register(CurrentWeather, WeatherAdmin)
admin.site.register(HighElevationForecast, HefAdmin)
