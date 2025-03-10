// Styling
import { eventStyles } from '../../data/featureStyleDefinitions.js';

// Append _unread to the key if the event is highlighted/updated
const getStyleKey = (baseKey, isHighlighted) => {
  return isHighlighted ? `${baseKey}_unread` : baseKey;
};

// Static assets
export const setEventStyle = (events, state) => {
  if (!Array.isArray(events)) { events = [events]; }

  events.forEach((event) => {
    const display_category = event.get('display_category');
    const is_closure = event.get('closed');
    const geometry = event.getGeometry().getType();
    const is_highlighted = event.get('highlight') ?? false;


    if (geometry !== 'Point') { // Line segments
      const category = is_closure ? 'closure' : display_category;

      if (event.get('layerType') === 'webgl') {
        event.setProperties(eventStyles['segments'][category][state]);
      } else {
        event.setStyle(eventStyles['segments'][category][state]);
      }
    } else { // Points
      const severity = event.get('severity').toLowerCase();
      if (is_closure) {
        if (display_category === 'futureEvents')
          return event.setStyle(eventStyles[getStyleKey('future_closures', is_highlighted)][state]);

        else
          return event.setStyle(eventStyles[getStyleKey('closures', is_highlighted)][state]);
      }

      switch (display_category) {
        case 'futureEvents':
          return event.setStyle(eventStyles[
            severity === 'major' ? getStyleKey('major_future_events', is_highlighted) : getStyleKey('future_events', is_highlighted)
          ][state]);

        case 'roadConditions':
          return event.setStyle(eventStyles[getStyleKey('road_conditions', is_highlighted)][state]);

        case 'chainUps':
            return event.setStyle(eventStyles[getStyleKey('chain_ups', is_highlighted)][state]);

        default: {
          const type = event.get('event_type').toLowerCase();
          if (type === 'construction') {
            event.setStyle(eventStyles[
              severity === 'major' ? getStyleKey('major_constructions', is_highlighted) : getStyleKey('constructions', is_highlighted)
            ][state]);
          } else { // Other major/minor delays
            event.setStyle(eventStyles[
              severity === 'major' ? getStyleKey('major_generic_delays', is_highlighted) : getStyleKey('generic_delays', is_highlighted)
            ][state]);
          }
        }
      }
    }
  })
};
