// React
import React from 'react';
import {useNavigate} from 'react-router-dom';

// Styling
import './AdvisoriesList.scss';

export default function Advisories() {
  const navigate = useNavigate();

  function handleClick() {
    // navigate(`/advisories/${advisory.id}`);
    navigate(`/advisories/123`);
  }

  return (
    <ul className="advisories-list">
      <li onClick={handleClick}>First advisory</li>
      <li onClick={handleClick}>Second advisory</li>
    </ul>
  );
}
