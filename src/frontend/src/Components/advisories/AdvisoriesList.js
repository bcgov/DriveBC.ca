// React
import React from 'react';
import {useNavigate} from 'react-router-dom';

// Third party packages
import parse from 'html-react-parser';

// Styling
import './AdvisoriesList.scss';

export default function Advisories(props) {
  const { advisories } = props;

  const navigate = useNavigate();

  function handleClick(advisory) {
     navigate(`/advisories/${advisory.id}`);
  }

  return (
    <ul className="advisories-list">
      {!!advisories && advisories.map((advisory, index) => {
        return (
          <li key={advisory.id} onClick={() => handleClick(advisory)}>
            <h1 className='advisories-li-title'>{advisory.title}</h1>
            <div className='advisories-li-description'>{parse(advisory.description)}</div>
            <hr/>
          </li>
        );
      })}
    </ul>
  );
}
