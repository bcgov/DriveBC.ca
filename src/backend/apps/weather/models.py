from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point

class RegionalWeather(BaseModel):
    location = models.PointField(null=True)
    code = models.CharField(max_length=10, null=True)
    location_latitude = models.CharField(max_length=10, null=True)
    location_longitude = models.CharField(max_length=10, null=True)
    name = models.CharField(max_length=100, null=True)
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
    
    def save(self, *args, **kwargs):
        latitude, longitude = self.convert_coordinates(str(self.location_latitude), str(self.location_longitude))
        self.location = Point(longitude, latitude)
        super().save(*args, **kwargs)
    
    def convert_coordinates(self, latitude_str, longitude_str):
        latitude = float(latitude_str[:-1])
        longitude = float(longitude_str[:-1])

        if latitude_str.endswith('S'):
            latitude = -latitude
        if longitude_str.endswith('W'):
            longitude = -longitude

        return latitude, longitude

