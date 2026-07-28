// React
import React, { useContext, useState, useEffect } from 'react';

// Internal imports
import { FilterContext } from '../../App';
import { collator } from '../data/webcams';

// Styling
import './HighwayFilter.scss';

export default function HighwayFilter(props) {
  /* Setup */
  // Props
  // selectedHighway/onSelectHighway enable controlled mode: selections are reported
  // to the parent instead of being written to the filter context immediately
  const { cameras, handleHwyFiltersClose, selectedHighway, onSelectHighway } = props;
  const isControlled = onSelectHighway !== undefined;

  // Contexts
  const { filterContext, setFilterContext } = useContext(FilterContext);

  // States
  const [orderedHighways, setOrderedHighways] = useState();

  const getOrderedHighways = (cameras) => {
    const highways = Array.from(new Set(cameras.map(camera => camera.highway_display)));
    const highwayObjs = highways.map(highway => ({
        key: highway,
        display: getHighwayDisplay(highway),
    }));
    return highwayObjs.sort((a, b) => collator.compare(a.key, b.key));
}

  // Effects
  useEffect(() => {
    if (cameras) {
      const orderedHighways = getOrderedHighways(cameras);
      setOrderedHighways(orderedHighways);
    }
  }, [cameras]);

  useEffect(() => {
    // Reset selected highway filter if it's filtered out by new route search
    const currentKey = isControlled ? selectedHighway : filterContext.highwayFilterKey;
    if (currentKey) {
      const orderedHighways = getOrderedHighways(cameras);
      const selectedHighwayObj = orderedHighways.find(highwayObj => highwayObj.key === currentKey);
      if (!selectedHighwayObj) {
        if (isControlled) {
          onSelectHighway(null);
        } else {
          setFilterContext({...filterContext, highwayFilterKey: null});
        }
      }
    }
  }, [orderedHighways]);

  /* Handlers */
  const selectHighway = (highwayKey) => {
    if (isControlled) {
      onSelectHighway(highwayKey);
      return;
    }

    setFilterContext({ ...filterContext, highwayFilterKey: highwayKey });
    handleHwyFiltersClose();
  };

  /* Rendering */
  // Sub components
  const getHighwayDisplay = (highway) => {
    return !isNaN(highway.charAt(0)) ? 'Highway ' + highway : highway;
  }

  const selectedHighwayKey = isControlled
    ? (selectedHighway || null)
    : (filterContext && filterContext.highwayFilterKey ? filterContext.highwayFilterKey : null);

  // Main component
  return filterContext && (
    <div className="highway-filters">
      {orderedHighways &&
        <div className="highway-options" role="radiogroup" aria-label="Highways">
          <label className="highway-row">
            <input
              type="radio"
              name="highway-filter"
              className="highway-row__radio"
              checked={selectedHighwayKey === null}
              onChange={() => selectHighway(null)} />
            <span className="highway-row__label">All highways</span>
          </label>

          {orderedHighways.map(highwayObj =>
            <label key={highwayObj.key} className="highway-row">
              <input
                type="radio"
                name="highway-filter"
                className="highway-row__radio"
                checked={selectedHighwayKey === highwayObj.key}
                onChange={() => selectHighway(highwayObj.key)} />
              <span className="highway-row__label">{highwayObj.display}</span>
            </label>
          )}
        </div>
      }
    </div>
  );
}
