// React
import React from 'react';
import {useNavigate} from 'react-router-dom';

// Third party packages
import parse from 'html-react-parser';

// Components and functions
import FriendlyTime from '../FriendlyTime';

// Styling
import './AdvisoriesList.scss';

export default function Advisories(props) {
  // State, props and context
  const { advisories, showDescriptions } = props;

  // Navigation
  const navigate = useNavigate();

  function handleClick(advisory) {
     navigate(`/advisories/${advisory.id}`);
  }

  // Rendering
  return (
    <ul className="advisories-list">
      {!!advisories && advisories.map((advisory, index) => {
        return (
          <li key={advisory.id} onClick={() => handleClick(advisory)}>
            <h5 className='advisories-li-title'>{advisory.title}</h5>

            {showDescriptions &&
              <div>
                <div className="timestamp-container">
                  <span>{advisory.live_revision > 1 ? "Published" : "Last updated" }</span>
                  <FriendlyTime date={advisory.latest_revision_created_at} />
                </div>

                <div className='advisories-li-body'>{parse(advisory.body)}</div>
              </div>
            }
          </li>
        );
      })}
    </ul>
  );
}
