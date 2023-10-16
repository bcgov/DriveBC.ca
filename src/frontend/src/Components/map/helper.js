// Styling
import { eventStyles } from '../data/eventStyleDefinitions.js';

export const getEventIcon = (event, state) => {
  const severity = event.get('severity').toLowerCase();
  const type = event.get('event_type').toLowerCase();
  const geometry = event.getGeometry().getType();
  if (geometry === 'Point') {
    if (severity === 'major') {
      switch (type) {
        case 'incident':
          return eventStyles['major_incident'][state];
        case 'construction':
          return eventStyles['major_construction'][state];
        case 'special_event':
          return eventStyles['major_special_event'][state];
        case 'weather_condition':
          return eventStyles['major_weather_condition'][state];
        default:
          return eventStyles['major_incident'][state];
      }
    } else {
      switch (type) {
        case 'incident':
          return eventStyles['incident'][state];
        case 'construction':
          return eventStyles['construction'][state];
        case 'special_event':
          return eventStyles['special_event'][state];
        case 'weather_condition':
          return eventStyles['weather_condition'][state];
        default:
          return eventStyles['incident'][state];
      }
    }
  } else {
    return eventStyles['segments'][state];
  }
};

export const transformFeature = (feature, sourceCRS, targetCRS) => {
  const clone = feature.clone();
  clone.getGeometry().transform(sourceCRS, targetCRS);
  return clone;
};
