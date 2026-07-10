// React
import React, { useContext, useState, useEffect, useCallback } from 'react';

// Redux
import { useSelector } from "react-redux";
import { memoize } from "proxy-memoize";

// Internal imports
import { FilterContext } from '../../App.js';

// Styling
import './AreaFilter.scss';

export default function AreaFilter(props) {
  /* Setup */
  // Props
  const { handleAreaFiltersClose, objects, showAllByDefault } = props;

  // Contexts
  const { filterContext, setFilterContext } = useContext(FilterContext);

  // Redux
  const { areas, selectedRoute } = useSelector(useCallback(memoize(state => ({
    areas: state.feeds.areas.list,
    selectedRoute: state.routes.selectedRoute
  }))));

  // States
  const [displayedAreas, setDisplayedAreas] = useState();

  // Effects
  useEffect(() => {
    if (!areas || !objects) {
      return;
    }

    // DBC22-4686: delay list should show all areas when no route is selected
    if (showAllByDefault && !selectedRoute) {
      setDisplayedAreas(areas);
      return;
    }

    // Show only areas that have an object
    const uniqueAreaIds = Array.from(new Set(objects.flatMap(obj =>
      // Handle both single and multiple areas (events)
      Array.isArray(obj.area) ? obj.area : [obj.area]
    )));

    const currentAreas = areas.filter(area => uniqueAreaIds.includes(area.id));
    setDisplayedAreas(currentAreas);

  }, [areas, objects]);

  /* Rendering */
  // Main component
  return filterContext && (
    <div className="area-filters">
      {displayedAreas &&
        <div className="area-options">
          {displayedAreas.map(areaObj =>
            <div
              key={areaObj.id}
              className="area-row"
              tabIndex={0}
              onClick={() => {
                setFilterContext({...filterContext, areaFilter: areaObj});
                handleAreaFiltersClose();
              }}
              onKeyDown={() => {
                setFilterContext({...filterContext, areaFilter: areaObj});
                handleAreaFiltersClose();
              }}>

              <span>{areaObj.name}</span>
            </div>
          )}
        </div>
      }
    </div>
  );
}
