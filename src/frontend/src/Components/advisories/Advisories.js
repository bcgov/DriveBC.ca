// React
import React, { useCallback, useEffect, useRef } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories } from '../../slices/cmsSlice';

// External Components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";

// Components and functions
import { getAdvisories } from '../data/advisories.js';
import AdvisoriesList from './AdvisoriesList';

// Styling
import './Advisories.scss';

export default function Advisories() {
  // Redux
  const dispatch = useDispatch();
  const { advisories } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories,
  }))));

  // Refs
  const isInitialMount = useRef(true);

  // Data loading
  const loadAdvisories = async () => {
    if (!advisories) {
      dispatch(updateAdvisories(await getAdvisories()));
    }
  }

  useEffect(() => {
    if (isInitialMount.current) { // Only run on initial load
      loadAdvisories();
      isInitialMount.current = false;
    }
  });

  return (
    <div className="advisories">
      <div className="imagery">
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>
      <div className="content">
        <h3>Advisory</h3>
        <AdvisoriesList advisories={advisories} showDescriptions={false} />
      </div>
    </div>
  );
}
