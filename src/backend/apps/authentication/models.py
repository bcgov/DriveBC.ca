from apps.authentication.enums import ROUTE_CRITERIA, ROUTE_CRITERIA_CHOICES
from apps.shared.models import BaseModel
from apps.webcam.models import Webcam
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.db.models.constraints import UniqueConstraint


class DriveBCUser(AbstractUser, BaseModel):
    verified = models.BooleanField(default=False)
    attempted_verification = models.BooleanField(default=False)

    consent = models.BooleanField(default=False)
    attempted_consent = models.BooleanField(default=False)


class FavouritedCameras(BaseModel):
    '''
    Webcam views favourited by the user.

    Cams are stored as views from a cam, because a cam can have multiple views
    (e.g., N, S and E).  Each webcam has a location field with a GIS point value
    that's used to group them.  By storing favourites by Webcam, we're storing
    views, allowing a user to favourite multiple distinct views for a single
    camera (e.g., a user can favourite the W and E views but not the N or S).
    '''

    user = models.ForeignKey(DriveBCUser, on_delete=models.CASCADE,
                             related_name="webcams")
    webcam = models.ForeignKey(Webcam, on_delete=models.CASCADE,
                               related_name="users")

    class Meta:
        constraints = [
            UniqueConstraint(fields=['user', 'webcam'], name='user_webcam')
        ]


# TODO: Add a clean_label method to provide a default value for label when a
# user doesn't have one.

# TODO: Add a clean_distance method that saves the value in km; distance_unit
# can be a preferred unit, but the standard value should be in km to allow for
# sorting/filtering
class SavedRoutes(BaseModel):
    '''
    Routes saved by the user.

    Routes generated from DataBC's router.  We store the time the route was
    last validated against the route returned from the router API; on creation,
    the route is considered validated because it came from the router recently.
    Over time, a route saved here may no longer match what the router returns
    due to changes in the road network (roads added or closed, for example).
    Saved routes should be validated periodically (e.g., on user login).
    '''

    user = models.ForeignKey(DriveBCUser, on_delete=models.CASCADE,
                             related_name='routes')
    route = gis_models.MultiLineStringField()

    # User friendly presentation
    label = models.CharField(max_length=100, null=False, blank=True)
    thumbnail = models.TextField(null=True, blank=True)
    distance = models.FloatField(null=True, blank=True)
    distance_unit = models.CharField(max_length=10, null=False, blank=True)

    # store search term for display, and point field for validation
    start = models.TextField(blank=True, null=False)
    start_point = gis_models.PointField()
    end = models.TextField(blank=True, null=False)
    end_point = gis_models.PointField()

    # last time the route was verified against the router API
    validated = models.DateTimeField(auto_now_add=True)

    criteria = models.CharField(choices=ROUTE_CRITERIA_CHOICES, max_length=100, default=ROUTE_CRITERIA.FASTEST)
    searchTimestamp = models.CharField(max_length=100, default='fastest')

    notification = models.BooleanField(default=False, blank=True)  # Whether to notify user of events on route
    notification_types = models.JSONField(default=list, blank=True)  # list of event display types to notify
    notification_days = models.JSONField(default=list, blank=True)  # List of days of the week
    notification_start_date = models.DateField(null=True, blank=True)  # Date to start notifications
    notification_end_date = models.DateField(null=True, blank=True)  # Date to end notifications
    notification_start_time = models.TimeField(null=True, blank=True)  # Time of day for notifications
    notification_end_time = models.TimeField(null=True, blank=True)  # Time of day for notifications

    class Meta:
        indexes = [
            models.Index(fields=['user', 'notification']),
            models.Index(fields=['notification_days']),
            models.Index(fields=['notification_start_date']),
            models.Index(fields=['notification_end_date']),
            models.Index(fields=['notification_start_time']),
            models.Index(fields=['notification_end_time']),
        ]
