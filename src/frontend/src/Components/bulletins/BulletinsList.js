// React
import React, { useState, useEffect } from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// Internal imports
import { stripRichText } from '../data/helper';
import FriendlyTime from '../shared/FriendlyTime';
import trackEvent from '../shared/TrackEvent';

// Styling
import './BulletinsList.scss';
import Skeleton from 'react-loading-skeleton';

// Static files
import logo from '../../images/dbc-logo--white.svg';

export default function Bulletins(props) {
  // State, props and context
  const { bulletins } = props;
  const [showLoader, setShowLoader] = useState(true);

  // Navigation
  const navigate = useNavigate();

  function handleClick(bulletin) {
    trackEvent('click', 'bulletins-list', 'Bulletin', bulletin.title, bulletin.teaser);
    navigate(`/bulletins/${bulletin.slug}`);
  }

  const sortedBulletins = bulletins && bulletins.sort((a, b) => {
    return new Date(b.last_published_at) - new Date(a.last_published_at);
  });

  useEffect(() => {
    if (sortedBulletins) {
      setShowLoader(false);
    } else {
      setShowLoader(true);
    }
  }, [sortedBulletins]);

  // Rendering
  return (
    <ul className='bulletins-list'>
      {!!sortedBulletins && sortedBulletins.map((bulletin, index) => {
        return (
          <li className='bulletin-li' key={bulletin.id} onClick={() => handleClick(bulletin)}
            onKeyDown={(keyEvent) => {
              if (keyEvent.keyCode == 13) {
                handleClick(bulletin);
              }
            }}>

            <div className='bulletin-li-title-container' tabIndex={0}>
            {showLoader ? <Skeleton width="100%" height={20} /> :
            <h2 className='bulletin-li-title'>{bulletin.title}</h2>
          }

              

            {showLoader ? (
            <Skeleton height={10} width="100%" />
            ) : (
            bulletin.teaser && <div className="bulletin-li-body">{bulletin.teaser}</div>
            )}

            {showLoader ? (
              <Skeleton height={10} width="100%" />
            ) : (
              bulletin.teaser && <div className='bulletin-li-body'>{stripRichText(bulletin.body)}</div>
            )}

            {showLoader ? <Skeleton width="100%" height={10} /> :
            <div className='timestamp-container'>
              <span className='bulletin-li-state'>{bulletin.first_published_at != bulletin.last_published_at ? 'Updated' : 'Published' }</span>
              <FriendlyTime date={bulletin.latest_revision_created_at} />
            </div>
            }
            </div>

            <div className='bulletin-li-thumbnail-container'>
              <div className={bulletin.image_url ? 'bulletin-li-thumbnail' : 'bulletin-li-thumbnail-default'}>
              {showLoader ? <Skeleton width={400} height={200} /> :
              <img className='thumbnail-logo' src={bulletin.image_url ? bulletin.image_url : logo} alt={bulletin.image_alt_text} />
              }
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
