from apps.shared.models import BaseModel
from django.contrib.gis.db import models

class Country(models.Model):
    code = models.CharField(max_length=2)
    value = models.CharField(max_length=255)

class Province(models.Model):
    code = models.CharField(max_length=2)
    value = models.CharField(max_length=255)

class Name(models.Model):
    code = models.CharField(max_length=255)
    latitude = models.CharField(max_length=10)
    longitude = models.CharField(max_length=10)
    value = models.CharField(max_length=255)

class Location(models.Model):
    continent = models.CharField(max_length=255, null=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE, null=True)
    province = models.ForeignKey(Province, on_delete=models.CASCADE, null=True)
    name = models.ForeignKey(Name, on_delete=models.CASCADE, null=True)
    region = models.CharField(max_length=255, null=True)

class Wind(models.Model):
    speed = models.IntegerField()
    gust = models.IntegerField(null=True)
    direction = models.CharField(max_length=10)
    bearing = models.IntegerField()
    index = models.CharField(max_length=10)
    rank = models.CharField(max_length=10)

class Forecast(models.Model):
    text_forecast_name = models.CharField(max_length=255)
    text_summary = models.TextField()
    icon_code_format = models.CharField(max_length=10)
    icon_code = models.CharField(max_length=10)
    pop_units = models.CharField(max_length=1)
    pop_value = models.IntegerField()
    temperatures_text_summary = models.CharField(max_length=255)
    temperature_class = models.CharField(max_length=10)
    temperature_units = models.CharField(max_length=2)
    temperature_value = models.IntegerField()
    winds_text_summary = models.CharField(max_length=255)
    precip_type_start = models.CharField(max_length=2, null=True)
    precip_type_end = models.CharField(max_length=2, null=True)
    precip_type_value = models.CharField(max_length=10, null=True)
    wind_chill_text_summary = models.CharField(max_length=255)
    relative_humidity_units = models.CharField(max_length=1)
    relative_humidity_value = models.IntegerField()
    uv_category = models.CharField(max_length=255, null=True)
    uv_index = models.IntegerField(null=True)
    uv_text_summary = models.TextField(null=True)
    frost = models.TextField(null=True)
    snow_level = models.TextField(null=True)
    comfort = models.TextField(null=True)

class ForecastGroup(models.Model):
    forecasts = models.ManyToManyField(Forecast)

class HourlyForecast(models.Model):
    hourly_timestamp_utc = models.DateTimeField()
    condition = models.CharField(max_length=255)
    icon_format = models.CharField(max_length=10)
    icon_code = models.CharField(max_length=10)
    temperature_units = models.CharField(max_length=2)
    temperature_value = models.IntegerField()
    lop_value = models.IntegerField()
    lop_category = models.CharField(max_length=10)
    lop_units = models.CharField(max_length=1)
    wind_chill_text_summary = models.TextField(null=True)
    wind_chill_calculated_value = models.IntegerField(null=True)
    wind_chill_units = models.CharField(max_length=2, null=True)
    wind_speed_units = models.CharField(max_length=5)
    wind_speed_value = models.IntegerField()
    wind_direction_value = models.CharField(max_length=10)

class HourlyForecastGroup(models.Model):
    hourly_forecasts = models.ManyToManyField(HourlyForecast)

class RiseSet(models.Model):
    sunrise_utc = models.CharField(max_length=255)
    sunset_utc = models.CharField(max_length=255)

class Temperature(models.Model):
    class_name = models.CharField(max_length=20)
    period = models.CharField(max_length=20)
    units = models.CharField(max_length=2)
    year = models.CharField(max_length=4)
    value = models.DecimalField(max_digits=5, decimal_places=1)

class Precipitation(models.Model):
    class_name = models.CharField(max_length=20)
    period = models.CharField(max_length=20)
    units = models.CharField(max_length=2)
    year = models.CharField(max_length=4)
    value = models.DecimalField(max_digits=5, decimal_places=1)

class Almanac(models.Model):
    temperatures = models.ManyToManyField(Temperature)
    precipitations = models.ManyToManyField(Precipitation)
    pop_units = models.CharField(max_length=1)
    pop_value = models.DecimalField(max_digits=5, decimal_places=1)

class Weather(BaseModel):
    xml_creation_utc = models.CharField(max_length=255, null=True)
    forecast_issued_utc = models.DateTimeField(null=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, null=True)
    warnings_url = models.URLField(null=True)
    current_conditions = models.JSONField(null=True)
    forecast_group = models.ForeignKey(ForecastGroup, on_delete=models.CASCADE, null=True)
    hourly_forecast_group = models.ForeignKey(HourlyForecastGroup, on_delete=models.CASCADE, null=True)
    rise_set = models.ForeignKey(RiseSet, on_delete=models.CASCADE, null=True)
    almanac = models.ForeignKey(Almanac, on_delete=models.CASCADE, default=None, null=True)
    forecast_id = models.IntegerField(null=True)

