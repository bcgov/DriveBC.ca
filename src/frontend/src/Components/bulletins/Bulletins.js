// React
import React, { useEffect, useState } from 'react';

// Third Party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";

// Components and functions
import { getBulletins } from '../data/bulletins.js';
import BulletinsList from './BulletinsList';

// Styling
import './Bulletins.scss';


export default function Bulletins() {
  const [bulletins, setBulletins] = useState(false);

  async function loadBulletins() {
    const bulletinsData = await getBulletins();
    setBulletins(bulletinsData);
  }

  useEffect(() => {
    loadBulletins();
  }, []);

  return (
    <div className="bulletins">
      <div className="imagery">
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>
      <div className="content">
        <h3>Bulletin</h3>
        <BulletinsList bulletins={bulletins} showDescriptions={false} />
      </div>
    </div>
  );
}
