from apps.shared.models import BaseModel
from django.contrib.gis.db import models
    
class RegionalWeather(BaseModel):
    location_code = models.CharField(max_length=10, null=True)
    location_latitude = models.CharField(max_length=10, null=True)
    location_longitude = models.CharField(max_length=10, null=True)
    location_name = models.CharField(max_length=100, null=True)
    region = models.CharField(max_length=255, null=True)
    
    observation_name = models.CharField(max_length=50, null=True)
    observation_zone = models.CharField(max_length=10, null=True)
    observation_utc_offset = models.IntegerField(null=True)
    observation_text_summary = models.CharField(max_length=255, null=True)

    conditions = models.JSONField(null=True)
    forecast_group = models.JSONField(null=True)
    hourly_forecast_group = models.JSONField(null=True)

    def get_forecasts(self):
        return self.forecast_group.get('Forecasts', [])

    def __str__(self):
        return f"Regional Forecast for {self.pk}"


