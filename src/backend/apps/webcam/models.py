import pytz
from apps.shared.models import Area, BaseModel
from apps.shared.status import get_image_list
from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from django.contrib.gis.db import models
from django.utils import timezone
from timezonefinder import TimezoneFinder


class Webcam(BaseModel):
    # Description
    name = models.CharField(max_length=128)
    name_override = models.CharField(blank=True, max_length=128)
    caption = models.CharField(blank=True, max_length=256)
    caption_override = models.CharField(blank=True, max_length=256)
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


class Region(models.Model):
    id = models.CharField(primary_key=True)
    seq = models.IntegerField()
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'Regions_Live'
        managed = False


class Highway(models.Model):
    id = models.AutoField(primary_key=True)
    hwy_number = models.CharField(max_length=20)
    section = models.CharField(max_length=100)

    class Meta:
        db_table = 'Highways_Live'
        managed = False


class RegionHighway(models.Model):
    highway_id = models.CharField(max_length=20, primary_key=True)
    region_id = models.CharField(max_length=20)
    seq = models.IntegerField()

    class Meta:
        db_table = 'Region_Highways_Live'
        managed = False


class CameraSource(models.Model):
    id = models.IntegerField(primary_key=True)
    cam_internetname = models.CharField(max_length=255, blank=True, null=True)
    cam_internetcaption = models.CharField(max_length=255, blank=True, null=True)
    cam_internetcredit = models.CharField(max_length=255, blank=True, null=True)
    cam_internetcomments = models.TextField(blank=True, null=True)
    cam_internetwebsite_url = models.CharField(max_length=500, blank=True, null=True)
    cam_internetgetfile2_url = models.CharField(max_length=500, blank=True, null=True)
    cam_internetdrivebc_url = models.CharField(max_length=500, blank=True, null=True)
    cam_internetftp_path = models.CharField(max_length=500, blank=True, null=True)
    cam_internetftp_folder = models.CharField(max_length=255, blank=True, null=True)
    cam_internetftp_filename = models.CharField(max_length=255, blank=True, null=True)
    cam_internetdisplay_folder = models.CharField(max_length=255, blank=True, null=True)
    cam_internetdisplay_filename = models.CharField(max_length=255, blank=True, null=True)
    cam_internetcontact_notes = models.TextField(blank=True, null=True)
    cam_internetdbc_mark = models.CharField(max_length=255, blank=True, null=True)
    cam_internetinset_horizontal = models.CharField(max_length=255, blank=True, null=True)
    cam_internetupdated_by = models.CharField(max_length=255, blank=True, null=True)
    cam_internetlast_updated = models.DateTimeField(blank=True, null=True)
    cam_locationsregion = models.CharField(max_length=255, blank=True, null=True)
    cam_locationsbusiness_area = models.CharField(max_length=255, blank=True, null=True)
    cam_locationshighway = models.CharField(max_length=255, blank=True, null=True)
    cam_locationshighway_section = models.CharField(max_length=255, blank=True, null=True)
    cam_locationsorientation = models.CharField(max_length=50, blank=True, null=True)
    cam_locationslandmark = models.CharField(max_length=255, blank=True, null=True)
    cam_locationscrossroad = models.CharField(max_length=255, blank=True, null=True)
    cam_locationselevation = models.IntegerField(blank=True, null=True)
    cam_locationscam_group = models.CharField(max_length=255, blank=True, null=True)
    cam_locationsgeo_latitude = models.CharField(max_length=255, blank=True, null=True)
    cam_locationsgeo_longitude = models.CharField(max_length=255, blank=True, null=True)
    cam_locationsalbers_northing = models.CharField(max_length=255, blank=True, null=True)
    cam_locationsalbers_easting = models.CharField(max_length=255, blank=True, null=True)
    cam_locationssegment = models.CharField(max_length=255, blank=True, null=True)
    cam_locationslrs_node = models.CharField(max_length=255, blank=True, null=True)
    cam_locationsdd = models.CharField(max_length=255, blank=True, null=True)
    cam_locationsmap_art_no = models.CharField(max_length=255, blank=True, null=True)
    cam_locationsthumbnail_map_url = models.CharField(max_length=500, blank=True, null=True)
    cam_locationsregional_map_url = models.CharField(max_length=500, blank=True, null=True)
    cam_locationsupdated_by = models.CharField(max_length=255, blank=True, null=True)
    cam_locationslast_updated = models.DateTimeField(blank=True, null=True)
    cam_controldisabled = models.BooleanField(default=False)
    isnew = models.BooleanField(default=False)
    cam_maintenanceis_on_demand = models.BooleanField(default=False)
    seq = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = 'Cams_Live'
        managed = False
