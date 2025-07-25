import { collator } from '../data/webcams';

export const getTypeDisplay = (event) => {
  switch (event.display_category) {
    case 'closures':
      return 'Closure';
    case 'majorEvents':
      return event.event_type === 'INCIDENT'
        ? 'Major incident '
        : 'Major delay';
    case 'minorEvents':
      return event.event_type === 'INCIDENT'
        ? 'Minor incident '
        : 'Minor delay';
    case 'futureEvents':
      if (event.severity === 'CLOSURE') {
        return 'Future closure event';
      } else if (event.severity === 'MAJOR') {
        return 'Major future event';
      }
      return 'Minor future event';
    case 'roadConditions':
      return 'Road condition';
    case 'chainUps':
      return 'Commercial chain-up';
    default:
      return '';
  }
}

export const getSeverityClass = (event) => {
  switch (event.display_category) {
    case 'chainUps':
      return 'chain-up';
    default:
      return event.severity;
  }
}

export const convertDirection = (direction) => {
  switch (direction) {
    case 'N':
      return 'Northbound';
    case 'W':
      return 'Westbound';
    case 'E':
      return 'Eastbound';
    case 'S':
      return 'Southbound';
    case 'BOTH':
      return 'Both Directions';
    case 'NONE':
      return ' ';
    default:
      return ' ';
  }
}

// react-table sorting functions
export const defaultSortFn = (rowA, rowB, columnId) => {
  const aValue = rowA.original ? rowA.original[columnId] : rowA[columnId];
  const bValue = rowB.original ? rowB.original[columnId] : rowB[columnId];

  return collator.compare(aValue, bValue);
}

export const routeAtSortFn = (rowA, rowB) => {
  const dataA = rowA.original || rowA;
  const dataB = rowB.original || rowB;

  return defaultSortFn(rowA, rowB,
    // Use highway ref as secondary sort
    dataA.route_at != dataB.route_at ? 'route_at' : 'start_point_linear_reference'
  );
}

export const routeOrderSortFn = (rowA, rowB) => {
  return defaultSortFn(rowA, rowB, 'route_projection');
}

export const severitySortFn = (rowA, rowB) => {
  const dataA = rowA.original || rowA;
  const dataB = rowB.original || rowB;

  // Reversed due to desc priority logic
  if (dataA.severity != dataB.severity) {
    return defaultSortFn(rowA, rowB, 'severity') * -1;

  // Reversed route secondary sort
  } else {
    return routeAtSortFn(rowA, rowB) * -1;
  }
}
