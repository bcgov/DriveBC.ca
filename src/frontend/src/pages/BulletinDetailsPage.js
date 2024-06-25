// React
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

// Third party packages
import Container from 'react-bootstrap/Container';
import parse from 'html-react-parser';

// Components and functions
import { getBulletins } from '../Components/data/bulletins.js';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Footer from '../Footer.js';
import FriendlyTime from '../Components/shared/FriendlyTime';

// Styling
import './BulletinDetailsPage.scss';

export default function BulletinDetailsPage() {
  // Context and router data
  const params = useParams();
  const isInitialMount = useRef(true);

  // UseState hooks
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

  // Data function and initialization
  const loadBulletin = async () => {
    const bulletinData = await getBulletins(params.id).catch((error) => displayError(error));
    setBulletin(bulletinData);
    isInitialMount.current = false;

    document.title = `DriveBC - Bulletins - ${bulletinData.title}`;
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
            <p>{parse(bulletin.body)}</p>
          </Container>
        </div>
      )}

      <Footer />
    </div>
  );
}
