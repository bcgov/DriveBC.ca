// React
import React, { useContext, useState, useEffect } from 'react';

// Internal imports
import { FilterContext } from '../../App.js';
import { collator } from '../data/webcams';

// Styling
import './HighwayFilter.scss';

export default function HighwayFilter(props) {
  /* Setup */
  // Props
  const { cameras, handleHwyFiltersClose } = props;

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
    if (filterContext.highwayFilterKey) {
      const orderedHighways = getOrderedHighways(cameras);
      const selectedHighway = orderedHighways.find(highwayObj => highwayObj.key === filterContext.highwayFilterKey);
      if (!selectedHighway) {
        setFilterContext({...filterContext, highwayFilterKey: null});
      }
    }
  }, [orderedHighways]);

  /* Rendering */

  // Sub components
  const getHighwayDisplay = (highway) => {
    return !isNaN(highway.charAt(0)) ? 'Highway ' + highway : highway;
  }

  // Main component
  return filterContext && (
    <div className="highway-filters">
      {orderedHighways &&
        <div className="highway-options">
          {orderedHighways.map(highwayObj =>
            <div
              key={highwayObj.key}
              className="highway-row"
              tabIndex={0}
              onClick={() => {
                setFilterContext({...filterContext, highwayFilterKey: highwayObj.key});
                handleHwyFiltersClose();
              }}
              onKeyDown={() => {
                setFilterContext({...filterContext, highwayFilterKey: highwayObj.key});
                handleHwyFiltersClose();
              }}>

              <span>{highwayObj.display}</span>
            </div>
          )}
        </div>
      }
    </div>
  );
}
