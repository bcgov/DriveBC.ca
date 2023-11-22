// React
import React, { useEffect, useState } from 'react';

// Third Party packages
import Accordion from 'react-bootstrap/Accordion';

// Styling
import './AdvisoriesAccordion.scss';

// Components and functions
import { getAdvisories } from '../data/advisories.js';
import AdvisoriesList from './AdvisoriesList';

export default function AdvisoriesAccordion() {
  const [advisories, setAdvisories] = useState([]);

  async function loadAdvisories() {
    const advisoriesData = await getAdvisories();
    setAdvisories(advisoriesData);
  }

  useEffect(() => {
    loadAdvisories();
  }, []);

  return (
    advisories.length > 0 ? (
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
