from django.conf import settings
from django.contrib.admin import AdminSite
from django.contrib.admin.apps import AdminConfig
from django.utils import timezone
from datetime import timedelta


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
        from email_log.models import Email

        extra = extra_context or {}
        thirty_days_ago = timezone.now() - timedelta(days=30)
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
        # Add your context here

        recent_emails = Email.objects.filter(date_sent__gte=twenty_four_hours_ago)
        total_recipients_last_24h = sum(
            len(email.recipients.split(';')) for email in recent_emails if email.recipients
        )
        extra['counts'] = {
            'basic_bceid_users_count': DriveBCUser.objects.filter(
                username__endswith='bceidbasic'
            ).count(),
            'bceid_users_logged_in_last_30_days': DriveBCUser.objects.filter(
                username__endswith='bceidbasic',
                last_login__gte=thirty_days_ago
            ).count(),
            'saved_routes': SavedRoutes.objects.count(),
            'unique_users_with_saved_routes': SavedRoutes.objects.values('user').distinct().count(),
            'unique_users_with_saved_routes_and_notifications': SavedRoutes.objects.filter(
                notification=True 
            ).values('user').distinct().count(),
            'favourited_cams': FavouritedCameras.objects.count(),
            'unique_users_with_favorited_cameras': FavouritedCameras.objects.values('user').distinct().count(),
            'total_recipients_last_24h': total_recipients_last_24h,
        }
        return super().index(request, extra)


class DriveBCAdminConfig(AdminConfig):
    default_site = 'config.admin.DriveBCAdminSite'
