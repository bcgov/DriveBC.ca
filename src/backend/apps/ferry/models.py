from apps.shared.enums import CacheKey
from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.core.cache import cache


class Ferry(BaseModel):
    # General
    id = models.PositiveSmallIntegerField(primary_key=True)
    name = models.CharField(max_length=128, blank=True, default='')
    route_id = models.PositiveSmallIntegerField()
    route_name = models.CharField(max_length=128, blank=True, default='')
    route_description = models.CharField(max_length=750, blank=True, default='')

    # Urls
    url = models.URLField(blank=True)
    image_url = models.URLField(blank=True)
    route_image_url = models.URLField(blank=True)

    # Location
    location = models.GeometryField(blank=True, null=True)

    # Capacity
    vehicle_capacity = models.PositiveIntegerField(blank=True, null=True)
    passenger_capacity = models.PositiveIntegerField(blank=True, null=True)
    crossing_time_min = models.PositiveIntegerField(blank=True, null=True)
    weight_capacity_kg = models.PositiveIntegerField(blank=True, null=True)

    # Schedule
    schedule_type = models.CharField(max_length=64, blank=True, default='')
    schedule_detail = models.TextField(blank=True, default='')
    special_restriction = models.CharField(max_length=750, blank=True, default='')

    # Contacts
    contact_org = models.CharField(max_length=128, blank=True, default='')
    contact_phone = models.CharField(max_length=32, blank=True, default='')
    contact_alt_phone = models.CharField(max_length=32, blank=True, default='')
    contact_fax = models.CharField(max_length=32, blank=True, default='')
    contact_email = models.EmailField(blank=True)
    contact_url_1 = models.URLField(blank=True)
    contact_url_2 = models.URLField(blank=True)

    # Webcams
    webcam_url_1 = models.URLField(blank=True)
    webcam_url_2 = models.URLField(blank=True)
    webcam_url_3 = models.URLField(blank=True)
    webcam_url_4 = models.URLField(blank=True)
    webcam_url_5 = models.URLField(blank=True)

    # Meta
    feed_created_at = models.DateTimeField(auto_now_add=True)
    feed_modified_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        cache.delete(CacheKey.FERRY_LIST)
