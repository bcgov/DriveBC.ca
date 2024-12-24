from apps.authentication.models import DriveBCUser
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin


class DriveBCUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'verified')
    fieldsets = UserAdmin.fieldsets + (
        ('DriveBC', {'fields': ('verified',)}),
    )


admin.site.register(DriveBCUser, DriveBCUserAdmin)
