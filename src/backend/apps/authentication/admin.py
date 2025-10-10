from apps.authentication.models import DriveBCUser, FavouritedCameras, SavedRoutes
from django.contrib import admin
from django.contrib.admin import ModelAdmin
from django.contrib.auth.admin import UserAdmin


class DriveBCUserAdmin(UserAdmin):
    list_display = (
        'username', 'email',
        'first_name', 'last_name',
        'is_staff', 'is_superuser',
        'verified', 'attempted_verification',
        'consent', 'attempted_consent'
    )
    fieldsets = UserAdmin.fieldsets + (
        ('DriveBC', {'fields': ('verified', 'attempted_verification', 'consent', 'attempted_consent')}),
    )


admin.site.register(DriveBCUser, DriveBCUserAdmin)


class SavedRouteAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(SavedRoutes, SavedRouteAdmin)


class FavouritedCamerasAdmin(ModelAdmin):
    readonly_fields = ('id', )


admin.site.register(FavouritedCameras, FavouritedCamerasAdmin)
