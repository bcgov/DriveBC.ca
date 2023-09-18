// React
import React from 'react';
import {useNavigate} from 'react-router-dom';

// Styling
import './AdvisoriesList.scss';

export default function Advisories() {
  const navigate = useNavigate();

  function handleClick() {
    // navigate(`/advisory-page/${advisory.id}`);
    navigate(`/advisory-page/`);
  }
  
  return (
    <ul className="advisories-list">
      <li onClick={handleClick} >First advisory</li>
      <li>Second advisory</li>
    </ul>
  );
}
