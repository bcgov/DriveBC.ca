from django.conf import settings
from django.contrib.admin import AdminSite
from django.contrib.admin.apps import AdminConfig


class DriveBCAdminSite(AdminSite):

    site_header = "DriveBC Administration"
    site_title = "DriveBC Administration"
    index_title = "DriveBC Administration"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if settings.FORCE_IDIR_AUTHENTICATION:
            self.login_template = 'admin/idir_login.html'

    def has_permission(self, request):
        ''' Beyond normal admin_views permission, verify that user is IDIR '''

        is_staff = super().has_permission(request)

        if settings.FORCE_IDIR_AUTHENTICATION:
            return is_staff and request.user.username.endswith('azureidir')

        return is_staff

    def index(self, request, extra_context=None):
        from apps.authentication.models import DriveBCUser, SavedRoutes, FavouritedCameras

        extra = extra_context or {}
        # Add your context here
        extra['counts'] = {
            'users': DriveBCUser.objects.count(),
            'saved_routes': SavedRoutes.objects.count(),
            'favourited_cams': FavouritedCameras.objects.count(),
        }
        return super().index(request, extra)


class DriveBCAdminConfig(AdminConfig):
    default_site = 'config.admin.DriveBCAdminSite'
