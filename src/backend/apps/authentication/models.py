from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.db.models.constraints import UniqueConstraint

from apps.shared.models import BaseModel
from apps.webcam.models import Webcam


class DriveBCUser(AbstractUser, BaseModel):
    pass


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


# TODO: Discuss hard cap on number of routes a user can have so that a user
# can't save an absurd number of routes, potentially DOSsing the backend with
# GIS queries on event ingestion
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

    # store search term for display, and point field for validation
    start = models.TextField(blank=True, null=False)
    start_point = gis_models.PointField()
    end = models.TextField(blank=True, null=False)
    end_point = gis_models.PointField()

    # last time the route was verified against the router API
    validated = models.DateTimeField(auto_now_add=True)
