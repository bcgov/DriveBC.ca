import { collator } from '../data/webcams';

export const getTypeDisplay = (data) => {
  const severityText = data.severity == 'MAJOR' ? 'Major' : 'Minor';

  switch (data.display_category) {
    case 'closures':
      return 'Closure';

    case 'futureEvents':
      return 'Future event'

    default:
      return severityText + (data.event_type == 'INCIDENT' ? ' incident' : ' current event');
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
