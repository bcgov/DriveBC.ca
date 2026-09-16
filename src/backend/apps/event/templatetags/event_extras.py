from apps.event.tasks import get_image_type_file_name
from django import template

register = template.Library()


@register.filter
def event_image_id(event):
    file_name = get_image_type_file_name(event)
    return file_name.split('.')[0]
