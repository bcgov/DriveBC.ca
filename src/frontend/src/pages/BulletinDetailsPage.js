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

              <h1 className="page-title">{bulletin.title}</h1>

              {bulletin.teaser &&
                <p className="page-description body--large">{bulletin.teaser}</p>
              }

              <div className="timestamp-container">
                <span>{bulletin.first_published_at != bulletin.last_published_at ? "Last updated" : "Published" }</span>
                <FriendlyTime date={bulletin.latest_revision_created_at} />
              </div>
            </Container>
          </div>

          <Container className="bulletin-body-container cms-body">
            <div>{renderWagtailBody(bulletin.body)}</div>
          </Container>
        </div>
      )}

      <Footer />
    </div>
  );
}
