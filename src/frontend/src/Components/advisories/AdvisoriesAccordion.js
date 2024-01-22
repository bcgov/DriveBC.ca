// React
import React, { useCallback, useEffect, useRef } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories } from '../../slices/cmsSlice';

// External Components
import Accordion from 'react-bootstrap/Accordion';

// Components and functions
import { getAdvisories } from '../data/advisories.js';
import AdvisoriesList from './AdvisoriesList';

// Styling
import './AdvisoriesAccordion.scss';

export default function AdvisoriesAccordion() {
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

  // Rendering
  return (
    (advisories && advisories.length > 0) ? (
      <Accordion className="advisories-accordion">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Advisory in area ({advisories.length})</Accordion.Header>
          <Accordion.Body>
            <AdvisoriesList advisories={advisories} showDescription={false} />
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    ) : null
  );
}
