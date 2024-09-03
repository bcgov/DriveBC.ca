// React
import React, { useContext } from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight
} from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import { CMSContext } from '../../App';
import { stripRichText } from '../data/helper';
import FriendlyTime from '../shared/FriendlyTime';
import trackEvent from '../shared/TrackEvent.js';

// Styling
import './AdvisoriesList.scss';

export default function AdvisoriesList(props) {
  /* Setup */
  // Context
  const { cmsContext } = useContext(CMSContext);

  // Navigation
  const navigate = useNavigate();

  // Props
  const { advisories, showDescription, showTimestamp, showPublished, showArrow, isAdvisoriesListPage } = props;

  function handleClick(advisory, keyEvent) {
    if (keyEvent && keyEvent.keyCode != 13 && keyEvent.keyCode != 32) {
      return;
    }

    trackEvent('click', 'advisories-list', 'Advisory', advisory.title, advisory.teaser);
    navigate(`/advisories/${advisory.id}`);
  }

  // Rendering
  return (
    <ul className="advisories-list">
      {!!advisories && advisories.map((advisory, index) => {
        if (isAdvisoriesListPage) {
          return (
            <div className="advisory-li" key={advisory.id}>
              <div className="advisory-li__content">
                <div className="advisory-li__content__partition advisory-li-title-container">
                  <a className="advisory-li-title"
                    href="#"
                    onClick={() => handleClick(advisory)}
                    onKeyDown={(keyEvent) => handleClick(advisory, keyEvent)}>

                    {advisory.title}
                  </a>

                  <div className="timestamp-container">
                    <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published" }</span>
                    <FriendlyTime date={advisory.latest_revision_created_at} />
                  </div>
                </div>

                <div className='advisory-li__content__partition advisory-li-body-container'>
                  {advisory.teaser &&
                    <div className='advisory-li-body'>{advisory.teaser}</div>
                  }

                  {!advisory.teaser &&
                    <div className='advisory-li-body'>{stripRichText(advisory.body)}</div>
                  }
                </div>

                <div className="advisory-li__content__partition timestamp-container timestamp-container--mobile">
                  <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published" }</span>
                  <FriendlyTime date={advisory.latest_revision_created_at} />
                </div>

                <div className="button-container">
                  <a className="viewDetails-link"
                    href="#"
                    onClick={() => handleClick(advisory)}
                    onKeyDown={(keyEvent) => handleClick(advisory, keyEvent)}
                    aria-label={`View advisory details for ${advisory.title}`}>

                    View details
                    <FontAwesomeIcon icon={faChevronRight} />
                  </a>
                </div>
              </div>
            </div>
          );

        } else {
          return (
            <a className={`advisory-li ${!cmsContext.readAdvisories.includes(advisory.id) ? 'unread' : ''}`}
              key={advisory.id}
              href="#"
              onClick={() => handleClick(advisory)}
              onKeyDown={(keyEvent) => handleClick(advisory, keyEvent)}>

              <div className="advisory-li__content" tabIndex={0}>
                <div className="advisory-li-title-container">
                  <p className='advisory-li-title'>{advisory.title}</p>

                  {(showTimestamp && showPublished) &&
                    <div className="timestamp-container">
                      {!cmsContext.readAdvisories.includes(advisory.id) && <div className="unread-display"></div>}
                      <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published" }</span>
                      <FriendlyTime date={advisory.latest_revision_created_at} />
                    </div>
                  }

                  {(showTimestamp && !showPublished) &&
                    <div className="timestamp-container">
                      {!cmsContext.readAdvisories.includes(advisory.id) && <div className="unread-display"></div>}
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
            </a>
          );
        }
      })}
    </ul>
  );
}
