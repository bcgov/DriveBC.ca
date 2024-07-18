// React
import React, { useState } from "react";


// Components and functions
import trackEvent from '../shared/TrackEvent';
import { resetClickedStates } from '../map/handlers/click';
import AdvisoriesPanel from '../map/panels/AdvisoriesPanel';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faXmark } from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';

// Styling
import './AdvisoriesWidget.scss';


export default function AdvisoriesWidget(props) {
  const { advisories, updateClickedFeature, open, clickedFeature, clickedFeatureRef, onMap } = props;
  const [openOverlay, setOpenOverlay] = useState(false);

  // Rendering
  return (
    (advisories && advisories.length > 0) ? (
      <div className="advisories-widget">
        {!onMap &&
          <React.Fragment>
            <Button
              className={'advisories-btn'}
              aria-label="open advisories list"
              onClick={() => setOpenOverlay(!openOverlay)}>
              <FontAwesomeIcon icon={faFlag} />
              <span>Advisories</span>
              <span className="advisories-count">{advisories.length}</span>
            </Button>

            <div className={`advisories-overlay popup--advisories ${openOverlay ? 'open' : ''}`}>
              <span id="button-close-overlay" aria-hidden="false" hidden>close overlay</span>
              <button
                className="close-panel"
                aria-label={`${openOverlay ? 'close overlay' : ''}`}
                aria-labelledby="button-close-overlay"
                aria-hidden={`${openOverlay ? false : true}`}
                tabIndex={`${openOverlay ? 0 : -1}`}
                onClick={() => setOpenOverlay(!openOverlay)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
              <AdvisoriesPanel advisories={advisories} />
            </div>
          </React.Fragment>
        }

        {onMap &&
          <Button
            className={'advisories-btn advisories-btn--onMap' + ((open && !clickedFeature.get) ? ' open' : '')}
            aria-label="open advisories list"
            onClick={() => {
              trackEvent('click', 'advisories-on-map', 'Advisories button');
              resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
              updateClickedFeature(advisories);
            }}>
            <FontAwesomeIcon icon={faFlag} />
            <span>Advisories in area</span>
            <span className="advisories-count">{advisories.length}</span>
          </Button>
        }
      </div>
    ) : null
  );
}
