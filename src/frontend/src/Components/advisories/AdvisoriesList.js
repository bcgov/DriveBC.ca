// React
import React from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// Components and functions
import { stripRichText } from '../data/helper';
import FriendlyTime from '../shared/FriendlyTime';
import trackEvent from '../shared/TrackEvent.js';

// Third party packages
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faChevronRight
} from '@fortawesome/pro-solid-svg-icons';

// Styling
import './AdvisoriesList.scss';


export default function Advisories(props) {
  // State, props and context
  const { advisories, showDescription, showTimestamp, showPublished, showArrow } = props;

  // Navigation
  const navigate = useNavigate();

  function handleClick(advisory) {
     navigate(`/advisories/${advisory.id}`);
     trackEvent('click', 'advisories-list', 'Advisory', advisory.title, advisory.teaser);
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

            <div className="advisory-li__content" tabIndex={0}>
              <div className="advisory-li-title-container">
                <p className='advisory-li-title'>{advisory.title}</p>
                {(showTimestamp && showPublished) &&
                <div className="timestamp-container">
                  <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published" }</span>
                  <FriendlyTime date={advisory.latest_revision_created_at} />
                </div>
                }
                {(showTimestamp && !showPublished) &&
                <div className="timestamp-container">
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
            </div>

            {showArrow &&
              <div className="advisory-li__arrow">
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            }
          </li>
        );
      })}
    </ul>
  );
}
