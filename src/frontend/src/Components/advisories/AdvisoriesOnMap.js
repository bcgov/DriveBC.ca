// React
import React, { useState } from 'react';

// Components and functions
import AdvisoriesList from './AdvisoriesList';

// Third party packages
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faFlag,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';

// Styling
import './AdvisoriesOnMap.scss';

export default function AdvisoriesOnMap(props) {
  const { advisories } = props;

  // States
  const [open, setOpen] = useState(false);

  // Rendering
  return (
    (advisories && advisories.length > 0) ? (
      <div className="advisories-on-map">
        <Button
          className={'advisories-on-map__btn' + (open ? ' open' : '')}
          aria-label="open advisories list"
          onClick={() => {
            open ? setOpen(false) : setOpen(true) }
          }>
          <FontAwesomeIcon icon={faFlag} />
          <span>Advisories in area</span>
          <span className="advisories-count">{advisories.length}</span>
        </Button>

        { open &&
          <div className="advisories-on-map__content">
            <h4>Advisories</h4>
            <button
              className="close-advisories"
              aria-label="close advisories list"
              onClick={() => setOpen(false)
            }>
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <AdvisoriesList advisories={advisories} showDescription={true} showTimestamp={false} />
          </div>
        }
      </div>
    ) : null
  );
}
