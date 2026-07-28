// React
import React, { useContext, useState, useEffect, useCallback } from 'react';

// Redux
import { useSelector } from "react-redux";
import { memoize } from "proxy-memoize";

// Internal imports
import { FilterContext } from '../../App';

// Styling
import './AreaFilter.scss';

export default function AreaFilter(props) {
  /* Setup */
  // Props
  // selectedArea/onSelectArea enable controlled mode: selections are reported
  // to the parent instead of being written to the filter context immediately
  const { handleAreaFiltersClose, objects, showAllByDefault, selectedArea, onSelectArea } = props;
  const isControlled = onSelectArea !== undefined;

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
    if (!areas) {
      return;
    }

    // DBC22-4686: delay list should show all areas when no route is selected
    // Independent of objects, so areas populate even while the list is still loading
    if (showAllByDefault && !selectedRoute) {
      setDisplayedAreas(areas);
      return;
    }

    if (!objects) {
      return;
    }

    // Show only areas that have an object
    const uniqueAreaIds = Array.from(new Set(objects.flatMap(obj =>
      // Handle both single and multiple areas (events)
      Array.isArray(obj.area) ? obj.area : [obj.area]
    )));

    const currentAreas = areas.filter(area => uniqueAreaIds.includes(area.id));
    setDisplayedAreas(currentAreas);

  }, [areas, objects, selectedRoute, showAllByDefault]);

  /* Handlers */
  const selectArea = (areaObj) => {
    if (isControlled) {
      onSelectArea(areaObj);
      return;
    }

    setFilterContext({ ...filterContext, areaFilter: areaObj });
    handleAreaFiltersClose();
  };

  /* Rendering */
  const selectedAreaObj = isControlled ? selectedArea : (filterContext ? filterContext.areaFilter : null);
  const selectedAreaId = selectedAreaObj ? selectedAreaObj.id : null;

  // Main component
  return filterContext && (
    <div className="area-filters">
      {displayedAreas &&
        <div className="area-options" role="radiogroup" aria-label="Areas">
          <label className="area-row">
            <input
              type="radio"
              name="area-filter"
              className="area-row__radio"
              checked={selectedAreaId === null}
              onChange={() => selectArea(null)} />
            <span className="area-row__label">All areas</span>
          </label>

          {displayedAreas.map(areaObj =>
            <label key={areaObj.id} className="area-row">
              <input
                type="radio"
                name="area-filter"
                className="area-row__radio"
                checked={selectedAreaId === areaObj.id}
                onChange={() => selectArea(areaObj)} />
              <span className="area-row__label">{areaObj.name}</span>
            </label>
          )}
        </div>
      }
    </div>
  );
}
