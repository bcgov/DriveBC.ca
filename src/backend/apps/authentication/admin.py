from apps.authentication.models import (
    DriveBCUser,
    EmailSubscription,
    FavouritedCameras,
    SavedRoutes,
)
from apps.cms.models import DriveBCMapWidget
from django.contrib.auth.admin import UserAdmin
from django.contrib.gis import admin


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


class SavedRouteAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    gis_widget = DriveBCMapWidget


admin.site.register(SavedRoutes, SavedRouteAdmin)


class FavouritedCamerasAdmin(admin.GISModelAdmin):
    readonly_fields = ('id', )
    gis_widget = DriveBCMapWidget


admin.site.register(FavouritedCameras, FavouritedCamerasAdmin)


class EmailSubscriptionAdmin(admin.ModelAdmin):
    readonly_fields = ('id',)
    list_display = (
        'id', 'user', 'area', 'notification',
        'notification_start_date', 'notification_end_date',
    )


admin.site.register(EmailSubscription, EmailSubscriptionAdmin)
