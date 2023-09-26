// React
import React, { useEffect, useState } from 'react';

// Third Party packages
import Accordion from 'react-bootstrap/Accordion';

// Styling
import './BulletinsAccordion.scss';

// Components and functions
import { getBulletins } from '../data/bulletins.js';
import BulletinsList from './BulletinsList';

export default function BulletinsAccordion() {
  const [bulletins, setBulletins] = useState([]);

  async function loadBulletins() {
    const bulletinsData = await getBulletins();
    setBulletins(bulletinsData);
  }

  useEffect(() => {
    loadBulletins();
  }, []);

  return (
    <Accordion className="bulletins-accordion">
      <Accordion.Item eventKey="0">
        <Accordion.Header>Bulletin in area ({bulletins.length})</Accordion.Header>
        <Accordion.Body>
          <BulletinsList bulletins={bulletins} showDescription={false} />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
