// React
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux'

// Components and functions
import { getRoute } from '../data/routes.js';
import { updateSelectedRoute } from '../..//slices/routesSlice'
import LocationSearch from './LocationSearch.js';

// Styling
import './Routing.scss';

export default function RouteSearch(props) {
  const { selectedLocation, selectedLocationTwo, setSelectedLocation, setSelectedLocationTwo } = props;

  // Redux
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedLocation && selectedLocation.length && selectedLocationTwo && selectedLocationTwo.length) {
      const firstPoint = selectedLocation[0].geometry.coordinates.toString();
      const secondPoint = selectedLocationTwo[0].geometry.coordinates.toString();

      const points = firstPoint + ',' + secondPoint;

      getRoute(points).then(routeData => {
        dispatch(updateSelectedRoute(routeData));
      });
    }
  }, [selectedLocationTwo]);

  // Rendering
  return (
    <div className="routing-container">
      <div className="typeahead-container">
        <LocationSearch setSelectedLocation={setSelectedLocation} />
      </div>

      {selectedLocation &&
        <div className="typeahead-container typeahead-container-two">
          <LocationSearch setSelectedLocation={setSelectedLocationTwo} />
        </div>
      }
    </div>
  );
}
