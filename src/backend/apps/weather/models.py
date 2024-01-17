from apps.shared.models import BaseModel
from django.contrib.gis.db import models
    
class RegionalCurrent(BaseModel):
    station_code = models.CharField(max_length=10)
    station_latitude = models.CharField(max_length=10, null=True)
    station_longitude = models.CharField(max_length=10, null=True)
    station_name = models.CharField(max_length=255)
    
    observation_name = models.CharField(max_length=50, null=True)
    observation_zone = models.CharField(max_length=10, null=True)
    observation_utc_offset = models.IntegerField(null=True)
    observation_text_summary = models.CharField(max_length=255, null=True)
    
    condition = models.CharField(max_length=255)
    
    temperature_units = models.CharField(max_length=5, null=True)
    temperature_value = models.FloatField(null=True)
    
    visibility_units = models.CharField(max_length=5, null=True)
    visibility_value = models.FloatField(null=True)
    
    wind_speed_units = models.CharField(max_length=5, null=True)
    wind_speed_value = models.FloatField(null=True)
    wind_gust_units = models.CharField(max_length=5, null=True)
    wind_gust_value = models.FloatField(null=True)
    wind_direction = models.CharField(max_length=5, null=True)

    def __str__(self):
        return f"{self.station_name} - {self.observation_text_summary}"


