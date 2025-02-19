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
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Footer from '../Footer.js';
import FriendlyTime from '../Components/shared/FriendlyTime';
import renderWagtailBody from '../Components/shared/renderWagtailBody.js';

// Styling
import './BulletinDetailsPage.scss';

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
    const bulletinData = await getBulletins(params.id).catch((error) => displayError(error));
    setBulletin(bulletinData);

    document.title = `DriveBC - Bulletins - ${bulletinData.title}`;

    // Combine and remove duplicates
    const readBulletins = Array.from(new Set([
      ...cmsContext.readBulletins,
      bulletinData.id.toString() + '-' + bulletinData.live_revision.toString()
    ]));
    const updatedContext = {...cmsContext, readBulletins: readBulletins};

    setCMSContext(updatedContext);
    localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
  };

  useEffect(() => {
    loadBulletin();
  }, []);

  let content = bulletin;
  if (content && params.subid) {
    content = bulletin.subpages.filter((sub) => sub.slug === params.subid)[0] || bulletin;
  }

  useEffect(() => {
    if (bulletin) {
      // setShowLoader(false);
      // Delay of 2 seconds for testing, should be removed after code review
      setTimeout(() => {
        setShowLoader(false);
      }, 2000);
    } else {
      setShowLoader(true);
    }
  }, [bulletin]);

  // Rendering
  return (
    <div className='bulletin-page cms-page'>
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

      {bulletin && (
        <div>
          <div className="page-header">
            <Container>
              <a
                className="back-link"
                onClick={returnHandler}
                onKeyDown={keyEvent => {
                  if (keyEvent.keyCode == 13) {
                    returnHandler();
                  }
                }}>
                <FontAwesomeIcon icon={faArrowLeft} />
                Back to last page
              </a>

              <h1 className="page-title">{content.title}</h1>

              {content.teaser &&
                <p className="page-description body--large">{content.teaser}</p>
              }

              <div className="timestamp-container">
                <span>{content.first_published_at != content.last_published_at ? "Last updated" : "Published" }</span>
                <FriendlyTime date={content.latest_revision_created_at} />
              </div>
            </Container>
          </div>

          <Container className="bulletin-body-container cms-body">
            {showLoader ? <Skeleton height={400} /> :
            <div>{renderWagtailBody(content.body)}</div>
            }
          </Container>
        </div>
      )}

      <Footer />
    </div>
  );
}
