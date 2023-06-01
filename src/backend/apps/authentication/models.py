from django.contrib.auth.models import AbstractUser

from apps.shared.models import BaseModel


class DriveBCUser(AbstractUser, BaseModel):
    pass
