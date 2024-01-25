// React
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories } from '../../slices/cmsSlice';

// Components and functions
import { getAdvisories } from '../data/advisories.js';
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

export default function AdvisoriesOnMap() {
  // Redux
  const dispatch = useDispatch();
  const { advisories } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
  }))));

  // Refs
  const isInitialMount = useRef(true);

  // Data loading
  const loadAdvisories = async () => {
    if (!advisories) {
      dispatch(updateAdvisories({
        list: await getAdvisories(),
        timeStamp: new Date().getTime()
      }));
    }
  }

  useEffect(() => {
    if (isInitialMount.current) { // Only run on initial load
      loadAdvisories();
      isInitialMount.current = false;
    }
  });
  
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
