// React
import React, { useContext } from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight
} from '@fortawesome/pro-solid-svg-icons';
import Button from "react-bootstrap/Button";
import Skeleton from 'react-loading-skeleton';

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
  const { advisories, showDescription, showTimestamp, showPublished, isAdvisoriesListPage, showLoader } = props;

  function handleClick(advisory, keyEvent) {
    // Ignore key presses that aren't enter or space
    if (keyEvent && !(['Enter', 'NumpadEnter', 'Space'].includes(keyEvent.key))) {
      return;
    }

    trackEvent('click', 'advisories-list', 'Advisory', advisory.title, advisory.teaser);
    navigate(`/advisories/${advisory.slug}`);
  }

  const sortedAdvisories = advisories && advisories.sort((a, b) => {
    return new Date(b.last_published_at) - new Date(a.last_published_at);
  });

  // Rendering
  return (
    <ul className="advisories-list">
      {!!sortedAdvisories && sortedAdvisories.map((advisory, index) => {
        if (isAdvisoriesListPage) {
          return (
            <div className="advisory-li" key={advisory.id}>
              <div className="advisory-li__content">
                <div className="advisory-li__content__partition advisory-li-title-container">
                  <div className="advisory-li-title link-div"
                    tabIndex={0}
                    onClick={() => handleClick(advisory)}
                    onKeyDown={(keyEvent) => handleClick(advisory, keyEvent)}>

                    {showLoader ? <Skeleton width={320} height={40} /> : advisory.title}
                  </div>

                  {showLoader ?
                    <Skeleton width={260} height={10} className="hidden-mobile" /> :

                    <div className="timestamp-container">
                      <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published" }</span>
                      <FriendlyTime date={advisory.latest_revision_created_at} />
                    </div>
                  }
                </div>

                {showLoader ?
                  <p className="body-skeleton">
                    <Skeleton height={10} />
                    <Skeleton height={10} />
                    <Skeleton height={10} />
                    <Skeleton height={10} />
                    <Skeleton height={10} />
                  </p> :

                  <div className='advisory-li__content__partition advisory-li-body-container'>
                    {advisory.teaser &&
                      <div className='advisory-li-body'>{advisory.teaser}</div>
                    }

                    {!advisory.teaser &&
                      <div className='advisory-li-body'>{stripRichText(advisory.body)}</div>
                    }
                  </div>
                }

                {showLoader ?
                  <Skeleton width={320} height={10} className='hidden-desktop' /> :

                  <div className="advisory-li__content__partition timestamp-container timestamp-container--mobile">
                    <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published"}</span>
                    <FriendlyTime date={advisory.latest_revision_created_at}/>
                  </div>
                }

                {showLoader ?
                  <Skeleton width={120} height={10}/> :

                  <div className="button-container">
                    <div className="viewDetails-link link-div"
                         tabIndex={0}
                         href="#"
                         onClick={() => handleClick(advisory)}
                         onKeyDown={(keyEvent) => handleClick(advisory, keyEvent)}
                      aria-label={`View advisory details for ${advisory.title}`}>

                      View details
                      <FontAwesomeIcon icon={faChevronRight} />
                    </div>
                  </div>
                }
              </div>
            </div>
          );

        } else {
          return (
            <div className={`advisory-li link-div ${!cmsContext.readAdvisories.includes(advisory.id.toString() + '-' + advisory.live_revision.toString()) ? 'unread' : ''}`}
              key={advisory.id}
              onClick={() => handleClick(advisory)}
              onKeyDown={(keyEvent) => handleClick(advisory, keyEvent)}
              tabIndex={0}>

              <div className="advisory-li__content">
                <div className="advisory-li-title-container">
                  <p className='advisory-li-title'>{advisory.title}</p>

                  {!showDescription && advisory.teaser &&
                    <p className="advisory-li-teaser">{advisory.teaser}</p>
                  }

                  {(showTimestamp && showPublished) &&
                    <div className="timestamp-container">
                      {!cmsContext.readAdvisories.includes(advisory.id.toString() + '-' + advisory.live_revision.toString()) && <div className="unread-display"></div>}
                      <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published" }</span>
                      <FriendlyTime date={advisory.latest_revision_created_at} />
                    </div>
                  }

                  <Button variant="light" className='view-details-btn'>
                    View Details
                    <FontAwesomeIcon icon={faChevronRight}/>
                  </Button>
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
            </div>
          );
        }
      })}
    </ul>
  );
}
