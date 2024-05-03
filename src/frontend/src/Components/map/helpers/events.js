// Styling
import { eventStyles } from '../../data/featureStyleDefinitions.js';

// Static assets
export const setEventStyle = (events, state) => {
  if (!Array.isArray(events)) { events = [events]; }

  events.forEach((event) => {
    const display_category = event.get('display_category');
    const is_closure = event.get('closed');
    const geometry = event.getGeometry().getType();

    if (geometry !== 'Point') { // Line segments
      const category = is_closure ? 'closure' : display_category;

      if (event.get('layerType') === 'webgl') {
        event.setProperties(eventStyles['segments'][category][state]);
      } else {
        event.setStyle(eventStyles['segments'][category][state]);
      }
    } else { // Points
      if (is_closure) {
        return event.setStyle(eventStyles['closures'][state]);
      }
      const severity = event.get('severity').toLowerCase();

      switch (display_category) {
        case 'futureEvents':
          return event.setStyle(eventStyles[
            severity === 'major' ? 'major_future_events' : 'future_events'
          ][state]);

        case 'roadConditions':
          return event.setStyle(eventStyles['road_conditions'][state]);

        default: {
          const type = event.get('event_type').toLowerCase();
          if (type === 'construction') {
            event.setStyle(eventStyles[
              severity === 'major' ? 'major_constructions' : 'constructions'
            ][state]);
          } else { // Other major/minor delays
            event.setStyle(eventStyles[
              severity === 'major' ? 'major_generic_delays' : 'generic_delays'
            ][state]);
          }
        }
      }
    }
  })
};
