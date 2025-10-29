from apps.shared.models import Area, BaseModel
from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from django.contrib.gis.db import models
import json
import os
from pathlib import Path
from apps.shared.status import get_image_list
from timezonefinder import TimezoneFinder
import pytz
from django.utils import timezone


class Webcam(BaseModel):
    # Description
    name = models.CharField(max_length=128)
    caption = models.CharField(blank=True, max_length=256)
    dbc_mark = models.CharField(blank=True, max_length=256)
    credit = models.CharField(blank=True, max_length=256)

    # Location
    region = models.PositiveSmallIntegerField()
    region_name = models.CharField(max_length=128)
    highway = models.CharField(max_length=32)
    highway_description = models.CharField(max_length=128, blank=True)
    highway_group = models.PositiveSmallIntegerField()
    highway_cam_order = models.PositiveSmallIntegerField()
    location = models.PointField()
    orientation = models.CharField(max_length=32, blank=True)
    elevation = models.PositiveSmallIntegerField()

    # Foreign keys
    area = models.ForeignKey(Area, on_delete=models.SET_NULL, null=True, blank=False)
    regional_weather_station = models.ForeignKey(RegionalWeather, on_delete=models.SET_NULL, null=True, blank=True)
    local_weather_station = models.ForeignKey(CurrentWeather, on_delete=models.SET_NULL, null=True, blank=True)
    hev_station = models.ForeignKey(HighElevationForecast, on_delete=models.SET_NULL, null=True, blank=True)

    # Relations
    group = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)
    nearby_objs = models.JSONField(default=dict, blank=True)

    # General status
    is_on = models.BooleanField(default=True)
    should_appear = models.BooleanField(default=True)
    is_new = models.BooleanField(default=False)
    is_on_demand = models.BooleanField(default=False)
    route_order = models.PositiveSmallIntegerField(null=True)

    # Update status
    marked_stale = models.BooleanField(default=False)
    marked_delayed = models.BooleanField(default=False)
    last_update_attempt = models.DateTimeField(null=True)
    last_update_modified = models.DateTimeField(null=True)
    update_period_mean = models.PositiveIntegerField()
    update_period_stddev = models.PositiveIntegerField()

    # HTTPS camera flag
    https_cam = models.BooleanField(default=False)

    # Within two standard deviations from mean
    @property
    def minimum_update_window(self):
        if not self.update_period_mean or not self.update_period_stddev:
            return 0  # Always update

        return self.update_period_mean - (2 * self.update_period_stddev)

    def should_update(self, time):
        if not self.last_update_modified:
            return True

        time_delta = time - self.last_update_modified
        return time_delta.total_seconds() >= self.minimum_update_window
    
    def get_image_paths(self):
            timestamps = get_image_list(self.id, "TIMELAPSE_HOURS")
            image_paths = []
            for ts in timestamps:
                filename = ts
                img_path = f"{self.id}/admin-timelapse/{filename}/"
                image_paths.append(img_path)
            return image_paths

    def get_timezone(self):
        if not self.location:
            return timezone.utc  # fallback

        tf = TimezoneFinder()
        # PointField stores as (x=lon, y=lat)
        tzname = tf.timezone_at(lng=self.location.x, lat=self.location.y)
        return pytz.timezone(tzname) if tzname else timezone.utc
