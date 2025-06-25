import logging

from apps.cms.models import Advisory, EmergencyAlert
from apps.cms.tasks import send_advisory_notifications
from django.contrib.auth.models import Permission
from django.templatetags.static import static
from django.urls import path
from django.utils.html import format_html
from wagtail import hooks
from wagtail.admin.rich_text.editors.draftail.features import ControlFeature
from wagtail.admin.ui.components import Component
from wagtail_modeladmin.options import ModelAdmin, modeladmin_register

from .models import Bulletin, SubPage
from .views import access_requested

logger = logging.getLogger(__name__)


@hooks.register("after_publish_page")
def post_edit_hook(request, page):
    # Only process published advisory pages
    if page.specific_class == Advisory:
        try:
            send_advisory_notifications(page.id)

        except Exception:
            logger.error(request, 'There was a problem sending an advisory notification')


@hooks.register("insert_global_admin_css")
def insert_global_admin_css():
    return format_html(
        '<link rel="stylesheet" type="text/css" href="{}">',
        static("wagtail_admin.css"),
    )


@hooks.register('register_permissions')
def register_advisory_permissions():
    app = 'cms'
    model = 'advisory'

    return Permission.objects.filter(content_type__app_label=app, codename__in=[
        f"view_{model}", f"add_{model}", f"change_{model}", f"delete_{model}"
    ])


@hooks.register('register_permissions')
def register_bulletin_permissions():
    app = 'cms'
    model = 'bulletin'

    return Permission.objects.filter(content_type__app_label=app, codename__in=[
        f"view_{model}", f"add_{model}", f"change_{model}", f"delete_{model}"
    ])


class BaseCMSAdmin(ModelAdmin):
    menu_order = 200  # will put in 3rd place (000 being 1st, 100 2nd)
    add_to_settings_menu = False  # or True to add your model to the Settings sub-menu
    exclude_from_explorer = (
        False  # or True to exclude pages of this type from Wagtail's explorer view
    )
    add_to_admin_menu = True  # or False to exclude your model from the menu
    list_display = ("title",)
    list_filter = ("title",)
    search_fields = ("title",)


class AdvisoryAdmin(BaseCMSAdmin):
    model = Advisory
    menu_icon = "warning"


class BulletinAdmin(BaseCMSAdmin):
    model = Bulletin
    menu_icon = "thumbtack"


class EmergencyAlertAdmin(BaseCMSAdmin):
    model = EmergencyAlert
    menu_icon = "thumbtack-crossed"


# Now you just need to register your customised ModelAdmin class with Wagtail
modeladmin_register(AdvisoryAdmin)
modeladmin_register(BulletinAdmin)
modeladmin_register(EmergencyAlertAdmin)


@hooks.register('register_rich_text_features')
def register_readinglevel_feature(features):
    feature_name = 'readinglevel'
    features.default_features.append(feature_name)

    features.register_editor_plugin(
        'draftail',
        feature_name,
        ControlFeature({'type': feature_name}, js=['readinglevel.js']),
    )


@hooks.register('construct_main_menu')
def hide_explorer_menu_items_without_right_groups(request, menu_items):
    '''
    For a user who is not in the required groups, empty the menu.

    Currently the groups are Editors (i.e., authors) and Moderators (i.e.,
    approvers).  A user who is merely in the IdirUser group should see nothing
    at all in the admin interface, but model_admin entries still show up.
    '''

    if not request.user.groups.filter(name__in=['Moderators', 'Editors']):
        menu_items[:] = []


class RequestAccessPanel(Component):
    order = 50
    template_name = 'wagtailadmin/request_access.html'


@hooks.register('construct_homepage_panels')
def add_access_request_panel(request, panels):
    if not request.user.groups.filter(name__in=['Moderators', 'Editors']):
        panels.append(RequestAccessPanel())


@hooks.register('register_admin_urls')
def add_access_requested_url():
    return [
        path('access-requested', access_requested, name='cms-access-requested'),
    ]


@hooks.register('after_publish_page')
def update_parent_page(request, page):
    ''' When saving a subpage, create a new revision for the parent page '''
    if page.specific_class == SubPage:
        page.get_parent().specific.save_revision().publish()
