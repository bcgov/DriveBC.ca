// React
import React from 'react';

// Third Party packages
import Accordion from 'react-bootstrap/Accordion';

// Styling
import './AdvisoriesAccordion.scss';

// Components and functions
import AdvisoriesList from './AdvisoriesList';

export default function AdvisoriesAccordion() {
  return (
    <Accordion className="advisories-accordion">
      <Accordion.Item eventKey="0">
        <Accordion.Header>Advisory in area (1)</Accordion.Header>
        <Accordion.Body>
          <AdvisoriesList />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
