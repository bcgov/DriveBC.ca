from apps.event.tasks import get_image_type_file_name
from config import settings
from django import template

register = template.Library()


@register.filter
def event_site_link(event, route):
    return (
        f'{settings.FRONTEND_BASE_URL}?type=event&display_category={event.display_category}&id={event.id}'
        f'&route_start={route.start}&route_start_point={route.start_point.x},{route.start_point.y}'
        f'&route_end={route.end}&route_end_point={route.end_point.x},{route.end_point.y}'
        f'&route_distance={route.distance}'
    )


@register.filter
def event_image_id(event):
    file_name = get_image_type_file_name(event)
    return file_name.split('.')[0]
