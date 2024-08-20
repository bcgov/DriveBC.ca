from apps.cms.models import Advisory, Bulletin, Ferry
from django.contrib.auth.models import Permission
from django.templatetags.static import static
from django.utils.html import format_html
from wagtail import hooks
from wagtail_modeladmin.options import ModelAdmin, modeladmin_register


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


@hooks.register('register_permissions')
def register_ferry_permissions():
    app = 'cms'
    model = 'ferry'

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


class FerryAdmin(BaseCMSAdmin):
    model = Ferry
    menu_icon = "snippet"


# Now you just need to register your customised ModelAdmin class with Wagtail
modeladmin_register(AdvisoryAdmin)
modeladmin_register(BulletinAdmin)
modeladmin_register(FerryAdmin)
