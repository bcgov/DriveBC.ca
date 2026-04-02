// React
import React from 'react';

// Components and functions
import AdvisoriesList from './AdvisoriesList';

export default function Advisories(props) {
  const { advisories, selectedRoute } = props;

  return (advisories && !!advisories.length) ? (
    <div className="advisories">

      <div className="title">
        <h4>Advisories</h4>
      </div>

      <div className="content">
        {(selectedRoute && selectedRoute.routeFound && Object.keys(selectedRoute).length !== 0) ?
          <p className="description">The following advisory affects a portion of the route you’ve chosen:</p> :
          <p className="description">The following advisories are in effect across BC:</p>
        }

        <AdvisoriesList advisories={advisories} showDescription={false} showTimestamp={true} showPublished={false} showArrow={true} />
      </div>
    </div>
  ) : null;
}
