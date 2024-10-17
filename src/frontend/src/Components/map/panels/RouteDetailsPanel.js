// React
import React, { useCallback, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';

// Internal imports
import RouteDetails from '../../routing/RouteDetails';
import { swapRoutesToFastest, swapRoutesToShortest } from '../../../slices/routesSlice';

// Styling
import './RouteDetailsPanel.scss';

export default function RouteDetailsPanel() {
  /* Setup */
  const dispatch = useDispatch();
  // Redux
  const { fastestRoute } = useSelector(useCallback(memoize(state => ({
    fastestRoute: state.routes.fastestRoute
  }))));

  const { shortestRoute } = useSelector(useCallback(memoize(state => ({
    shortestRoute: state.routes.shortestRoute
  }))));

  const [activeIndex, setActiveIndex] = useState(null);

  const handleRouteClick = (index) => {
    setActiveIndex(index);
    if(index === 0){
      dispatch(swapRoutesToFastest());
    }
    if(index === 1){
      dispatch(swapRoutesToShortest());
    }
  };

  /* Rendering */
  // Main component
  return (
    <div className="popup popup--route" tabIndex={0}>
      <div className="popup__title">
        <p className="name">Your route</p>
      </div>

      <div className="popup__content">
        <RouteDetails route={fastestRoute} isPanel={true} isActive={activeIndex === 0} // Pass active state for the first RouteDetails
        onClick={() => handleRouteClick(0)} />
      <br/>
      <RouteDetails route={shortestRoute} isPanel={true} isActive={activeIndex === 1} // Pass active state for the first RouteDetails
        onClick={() => handleRouteClick(1)} />
      </div>
     
    </div>
  );
}
