// React
import React from 'react';

// Components and functions
import trackEvent from '../shared/TrackEvent';

// Third party packages
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faFlag
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';

// Styling
import './AdvisoriesOnMap.scss';



export default function AdvisoriesOnMap(props) {
  const { advisories, updateClickedFeature, open, clickedFeature } = props;

  // Rendering
  return (
    (advisories && advisories.length > 0) ? (
      <div className="advisories-on-map">
        <Button
          className={'advisories-on-map__btn' + ((open && !clickedFeature.get) ? ' open' : '')}
          aria-label="open advisories list"
          onClick={() => {
            trackEvent('click', 'advisories-on-map', 'Advisories button');
            updateClickedFeature(advisories);
          }
          }>
          <FontAwesomeIcon icon={faFlag} />
          <span>Advisories in area</span>
          <span className="advisories-count">{advisories.length}</span>
        </Button>
      </div>
    ) : null
  );
}
