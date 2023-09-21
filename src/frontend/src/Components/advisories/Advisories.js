// React
import React, { useEffect, useState } from 'react';

// Third Party packages
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
  const [advisories, setAdvisories] = useState(false);

  async function loadAdvisories() {
    const advisoriesData = await getAdvisories();
    setAdvisories(advisoriesData);
  }

  useEffect(() => {
    loadAdvisories();
  }, []);

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
