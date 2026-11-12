import re

from apps.event.enums import (
    EVENT_DIRECTION_DISPLAY,
    EVENT_DISPLAY_CATEGORY,
    EVENT_SEVERITY,
)
from apps.event.helpers import (
    get_in_effect_items,
    get_location_length,
    get_restriction_items,
    get_traffic_impact_items,
)
from apps.event.tasks import get_event_subject_label, get_image_type_file_name
from django import template

register = template.Library()


@register.filter
def event_image_id(event):
    file_name = get_image_type_file_name(event)
    return file_name.split('.')[0]


@register.filter
def sub_type_label(event):
    return event.event_sub_type.replace('_', ' ').capitalize()


@register.filter
def no_autolink(value):
    # zwnj stops mail clients linking names like "Highway 20" to maps
    # nbsp keeps "Highway 5" on one line
    return re.sub(r'(?<=Highway) (?=\d)', ' ‌', str(value)).replace(' ', ' ‌')


@register.filter
def event_label(event):
    return get_event_subject_label(event)


@register.filter
def event_theme(event):
    closure = event.display_category == EVENT_DISPLAY_CATEGORY.CLOSURE or event.closed
    if closure or event.severity == EVENT_SEVERITY.MAJOR:
        return {'bg': '#F4E1E2', 'color': '#B73433'}

    if event.display_category == EVENT_DISPLAY_CATEGORY.CHAIN_UP:
        return {'bg': '#FDF9D5', 'color': '#2D2D2D'}

    return {'bg': '#FEF0D8', 'color': '#584215'}


@register.filter
def has_changed(event, field):
    return field in getattr(event, 'changed', [])


ITEM_GETTERS = {
    'impacts': get_traffic_impact_items,
    'in_effect': get_in_effect_items,
    'restrictions': get_restriction_items,
}


@register.filter
def item_changes(event, field):
    current = ITEM_GETTERS[field](event)
    previous = ITEM_GETTERS[field](event.previous) if getattr(event, 'previous', None) else current
    return [(text, '' if text in previous else 'added') for text in current] + \
        [(text, 'removed') for text in previous if text not in current]


@register.filter
def event_title(event):
    route, _, alias = (event.route_at or '').partition(', ')
    name = event.highway_segment_names or route
    direction = EVENT_DIRECTION_DISPLAY.get(event.direction) if event.direction != 'NONE' else None
    return {
        'title': f'{direction} on {name}' if direction else name,
        'subtitle': '' if event.highway_segment_names else alias,
    }


@register.filter
def location_blocks(description, landmark=''):
    blocks = []
    for block in (description or '').split('<br><br>'):
        lines = [re.sub(r'^(Starts|Ends):', '', line).strip() for line in block.split('<br>')]
        if any(lines):
            blocks.append([line for line in lines if line])

    if landmark and not any(landmark in lines for lines in blocks):
        if blocks:
            blocks[0].insert(1, landmark)
        else:
            blocks.append([landmark])

    return blocks


def get_location_ends(description):
    ends = {}
    for block in (description or '').split('<br><br>'):
        key, _, rest = block.partition(':')
        lines = [line.strip() for line in rest.split('<br>') if line.strip()]
        if key in ('Starts', 'Ends') and lines:
            ends[key] = lines

    return ends


@register.filter
def location_extent(event):
    ends = get_location_ends(event.location_description)
    if len(ends) < 2:
        return None

    previous = get_location_ends(event.previous.location_description) if getattr(event, 'previous', None) else ends
    return {
        'length': get_location_length(event),
        'sides': [{
            'label': key,
            'lines': ends[key],
            'previous': previous.get(key) if previous.get(key) != ends[key] else None,
            'changed': previous.get(key) != ends[key],
        } for key in ('Starts', 'Ends')],
    }


@register.filter
def item_icon(text, field):
    if field == 'restrictions':
        return 'restriction-triangle'

    if field != 'impacts':
        return ''

    if text.startswith('Estimated ') and text.endswith(' delay'):
        return 'impact-clock'

    return 'impact-do-not-enter' if 'clos' in text.lower() else 'impact-exclamation-circle'
