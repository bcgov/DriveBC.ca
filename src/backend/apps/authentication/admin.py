from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.authentication.models import DriveBCUser


class DriveBCUserAdmin(UserAdmin):
    pass


admin.site.register(DriveBCUser, DriveBCUserAdmin)
