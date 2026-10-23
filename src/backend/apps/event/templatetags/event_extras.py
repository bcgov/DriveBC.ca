from apps.event.tasks import get_image_type_file_name
from django import template

register = template.Library()


@register.filter
def event_image_id(event):
    file_name = get_image_type_file_name(event)
    return file_name.split('.')[0]


@register.filter
def no_autolink(value):
    # DBC22-7458: zero-width non-joiner stops mail clients linking names like "Highway 20" to maps
    return str(value).replace(' ', ' ‌')
