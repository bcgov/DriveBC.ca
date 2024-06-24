from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point


class RegionalWeather(BaseModel):
    """ Weather reports and forecasts from Environment Canada """

    code = models.CharField(max_length=10, null=True)
    station = models.CharField(max_length=3, null=True)
    name = models.CharField(max_length=100, null=True)
    region = models.CharField(max_length=255, null=True)

    location_latitude = models.CharField(max_length=10, null=True)
    location_longitude = models.CharField(max_length=10, null=True)
    location = models.PointField(null=True)

    observed = models.DateTimeField(null=True)  # current conditions
    forecast_issued = models.DateTimeField(null=True)
    sunrise = models.DateTimeField(null=True)
    sunset = models.DateTimeField(null=True)

    conditions = models.JSONField(null=True)
    forecast_group = models.JSONField(null=True)
    hourly_forecast_group = models.JSONField(null=True)

    warnings = models.JSONField(null=True)

    def get_forecasts(self):
        return self.forecast_group.get('Forecasts', [])

    def __str__(self):
        return f"Regional Forecast for {self.code} ({self.station})"

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


class CurrentWeather(BaseModel):
    """ Local Weather reports and forecasts from MOTI sites """

    location = models.PointField(null=True)
    weather_station_name = models.CharField(max_length=100)
    elevation = models.IntegerField(null=True)
    location_latitude = models.CharField(max_length=20, null=True)
    location_longitude = models.CharField(max_length=20, null=True)
    location_description = models.TextField(null=True)
    datasets = models.JSONField(default=list, null=True)
    issuedUtc = models.DateTimeField(null=True)
    hourly_forecast_group = models.JSONField(null=True)


    def get_forecasts(self):
        return self.hourly_forecast_group.get('Forecasts', [])

    def __str__(self):
        return f"Current weather for {self.pk}"

    def save(self, *args, **kwargs):
        self.location = Point(self.location_longitude, self.location_latitude)
        super().save(*args, **kwargs)
