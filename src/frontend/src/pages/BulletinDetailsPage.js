// React
import React, { useContext, useEffect, useState } from 'react';

// Navigation
import { useParams, useNavigate } from 'react-router-dom';

// External imports
import Container from 'react-bootstrap/Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft
} from '@fortawesome/pro-solid-svg-icons';
import Skeleton from 'react-loading-skeleton';

// Internal imports
import { CMSContext } from '../App';
import { getBulletins } from '../Components/data/bulletins.js';
import { NetworkError, NotFoundError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Footer from '../Footer.js';
import FriendlyTime from '../Components/shared/FriendlyTime';
import renderWagtailBody from '../Components/shared/renderWagtailBody.js';
import ShareURLButton from '../Components/shared/ShareURLButton';

// Styling
import './BulletinDetailsPage.scss';

const NOT_FOUND_CONTENT = {
  title: 'Bulletin Not Found',
  teaser: 'There is currently no published bulletin at this URL',
  body: '',
};


export default function BulletinDetailsPage() {
  /* Setup */
  // Navigation
  const params = useParams();
  const navigate = useNavigate();

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  // States
  const [bulletin, setBulletin] = useState(null);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

   // Navigating to
   const returnHandler = () => {
    navigate(-1);
  };

  // Data function and initialization
  const loadBulletin = async () => {
    const bulletinData = await getBulletins(params.id).catch((error) => {
      if (error instanceof NotFoundError) {
        return NOT_FOUND_CONTENT;
      } else {
        displayError(error)
      }
    });
    setBulletin(bulletinData);

    document.title = `DriveBC - Bulletins - ${bulletinData.title}`;

    // Combine and remove duplicates
    if (bulletinData.id) {
      const readBulletins = Array.from(new Set([
        ...cmsContext.readBulletins,
        bulletinData.id.toString() + '-' + bulletinData.live_revision.toString()
      ]));
      const updatedContext = {...cmsContext, readBulletins: readBulletins};

      setCMSContext(updatedContext);
      localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
    }

    setShowLoader(false);
  };

  useEffect(() => {
    loadBulletin();
  }, [params.id]);

  let content = bulletin;
  if (content && params.subid) {
    content = bulletin.subpages.filter((sub) => sub.slug === params.subid)[0] || bulletin;
  }

  // Rendering
  return (
    <div className='bulletin-page cms-page'>
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

      <div className="page-header">
        <Container id="back-container">
          <a
            className="back-link"
            onClick={returnHandler}
            onKeyDown={keyEvent => {
              if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                returnHandler();
              }
            }}
            tabIndex={0}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to last page
          </a>
        </Container>
      </div>

      <Container className="page-header__title">
        {content && !showLoader &&
          <React.Fragment>
            <h1 className="page-title">{content.title}</h1>

            {content.teaser &&
              <p className="page-description body--large">{content.teaser}</p>
            }

            {content.first_published_at &&
              <div className="page-header__title__meta">
                <div className="timestamp-container">
                  <span>{content.first_published_at != content.last_published_at ? "Updated" : "Published" }</span>
                  <FriendlyTime date={content.latest_revision_created_at} />
                </div>
                <ShareURLButton />
              </div>
            }
          </React.Fragment>
        }

        {showLoader &&
          <div>
            <br/><Skeleton width={280} height={36}/>
            <br/><Skeleton width={320} height={24}/>
            <br/><Skeleton width={240} height={18}/>
          </div>
        }
      </Container>

      <Container className="bulletin-body-container cms-body">
        {showLoader &&
          <Skeleton height={320} />
        }

        {!showLoader && content &&
          <div>{renderWagtailBody(content.body)}</div>
        }
      </Container>

      <Footer />
    </div>
  );
}
