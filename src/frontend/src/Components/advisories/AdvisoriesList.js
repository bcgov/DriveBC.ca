// React
import React from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// Components and functions
import { stripRichText } from '../data/helper';
import FriendlyTime from '../FriendlyTime';

// Styling
import './AdvisoriesList.scss';

export default function Advisories(props) {
  // State, props and context
  const { advisories, showDescription, showTimestamp } = props;

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
          <li className="advisory-li unread" key={advisory.id} onClick={() => handleClick(advisory)}
            onKeyDown={(keyEvent) => {
              if (keyEvent.keyCode == 13) {
                handleClick(advisory);
              }
            }}>

            <div className="advisory-li-title-container" tabIndex={0}>
              <h4 className='advisory-li-title'>{advisory.title}</h4>
              {showTimestamp &&
              <div className="timestamp-container">
                <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published" }</span>
                <FriendlyTime date={advisory.latest_revision_created_at} />
              </div>
              }
            </div>

            {showDescription &&
              <div className='advisory-li-body-container'>
                {advisory.teaser &&
                  <div className='advisory-li-body'>{advisory.teaser}</div>
                }

                {!advisory.teaser &&
                  <div className='advisory-li-body'>{stripRichText(advisory.body)}</div>
                }
              </div>
            }

            {showTimestamp &&
            <div className="timestamp-container timestamp-container--mobile">
              <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published" }</span>
              <FriendlyTime date={advisory.latest_revision_created_at} />
            </div>
            }
          </li>
        );
      })}
    </ul>
  );
}
