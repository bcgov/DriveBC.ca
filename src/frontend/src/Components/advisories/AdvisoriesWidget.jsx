// React
import React from "react";


// Components and functions
import trackEvent from '../shared/TrackEvent';
import { resetClickedStates } from '../map/handlers/click';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';


export default function AdvisoriesWidget(props) {
  const { advisories, updateClickedFeature, open, clickedFeature, clickedFeatureRef } = props;

  // Rendering
  return (
    (advisories && advisories.length > 0) ? (
      <Button
        className={'advisories-btn advisories-btn--onMap' + ((open && clickedFeature && !clickedFeature.get) ? ' open' : '')}
        aria-label="open advisories list"
        onClick={() => {
          trackEvent('click', 'advisories-btn', 'Advisories button');
          resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
          updateClickedFeature(advisories);
        }}>
        <FontAwesomeIcon icon={faFlag} />
        <span>Advisories in area</span>
        <span className="advisories-count">{advisories.length}</span>
      </Button>
    ) : null
  );
}
