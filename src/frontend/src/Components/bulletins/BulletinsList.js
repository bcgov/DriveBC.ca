// React
import React from 'react';

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
  const { bulletins, showLoader } = props;

  // Navigation
  const navigate = useNavigate();

  function handleClick(bulletin) {
    trackEvent('click', 'bulletins-list', 'Bulletin', bulletin.title, bulletin.teaser);
    navigate(`/bulletins/${bulletin.slug}`);
  }

  const sortedBulletins = bulletins && bulletins.sort((a, b) => {
    return new Date(b.last_published_at) - new Date(a.last_published_at);
  });

  // Rendering
  return (
    <ul className='bulletins-list'>
      {!!sortedBulletins && sortedBulletins.map((bulletin, index) => {
        return (
          <li className='bulletin-li' key={bulletin.id} onClick={() => handleClick(bulletin)}
            onKeyDown={(keyEvent) => {
              if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                handleClick(bulletin);
              }
            }}>

            <div className='bulletin-li-title-container' tabIndex={0}>
              {showLoader ?
                <p><Skeleton height={30} /></p> :

                <h2 className='bulletin-li-title'>{bulletin.title}</h2>
              }

              {showLoader ?
                <p>
                  <Skeleton height={10} />
                  <Skeleton height={10} />
                </p> :

                (bulletin.teaser &&
                  <div className="bulletin-li-body">{bulletin.teaser}</div>
                )
              }

              {showLoader ?
                <p>
                  <Skeleton height={10} />
                  <Skeleton height={10} />
                  <Skeleton height={10} />
                </p> :

                (bulletin.teaser &&
                  <div className='bulletin-li-body'>{stripRichText(bulletin.body)}</div>
                )
              }

              {showLoader ?
                <p><Skeleton width={150} height={10} /></p> :

                <div className='timestamp-container'>
                  <span className='bulletin-li-state'>{bulletin.first_published_at != bulletin.last_published_at ? 'Updated' : 'Published' }</span>
                  <FriendlyTime date={bulletin.latest_revision_created_at} />
                </div>
              }
            </div>

            <div className='bulletin-li-thumbnail-container'>
              <div className={bulletin.image_url ? 'bulletin-li-thumbnail' : 'bulletin-li-thumbnail-default'}>
                {showLoader ?
                  <Skeleton width={320} height={200} /> :

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
