// React
import React, { useContext, useEffect, useState, useRef } from 'react';

// Navigation
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

// External imports
import Container from 'react-bootstrap/Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import Skeleton from 'react-loading-skeleton';

// Internal imports
import { CMSContext } from '../App';
import { getBulletins, getBulletinsPreview, markBulletinsAsRead } from '../Components/data/bulletins.js';
import { NetworkError, NotFoundError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Footer from '../Footer.js';
import FriendlyTime from '../Components/shared/FriendlyTime';
import renderWagtailBody from '../Components/shared/renderWagtailBody.js';
import ShareURLButton from '../Components/shared/ShareURLButton';
import PollingComponent from "../Components/shared/PollingComponent";

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
  const cmsContextRef = useRef(cmsContext);

  // States
  const [bulletin, setBulletin] = useState(null);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const [showUpdateOverlay, setShowUpdateOverlay] = useState(false);
  const initialNotifiedAt = useRef(null);
  const dismissedNotifiedAt = useRef(null);
  const [latestNotifiedAt, setLatestNotifiedAt] = useState(null);
  const currentRevision = useRef(null);

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

  const checkForUpdates = async () => {
    try {
      const latestData = await getBulletins(params.id);

      if (!latestData) return;

      // Detect any publish (major or minor)
      const contentChanged =
        latestData.live_revision !== currentRevision.current;

      if (contentChanged) {
        setBulletin(latestData);

        currentRevision.current = latestData.live_revision;

        document.title = `DriveBC - Bulletins - ${latestData.title}`;
      }

      // Detect major update only
      const latestNotified = latestData.last_notified_at;

      if (
        latestNotified &&
        latestNotified !== initialNotifiedAt.current &&
        latestNotified !== dismissedNotifiedAt.current
      ) {
        setLatestNotifiedAt(latestNotified);
        initialNotifiedAt.current = latestNotified;
        setShowUpdateOverlay(true);
      }
    } catch (error) {
      // silently ignore
    }
  };

  // Data function and initialization
  const loadBulletin = async () => {
    const bulletinData = await (isPreview ? getBulletinsPreview(params.id) : getBulletins(params.id)).catch((error) => {
      if (error instanceof NotFoundError) {
        return NOT_FOUND_CONTENT;
      } else {
        displayError(error)
      }
    });
    setBulletin(bulletinData);

    document.title = `DriveBC - Bulletins - ${bulletinData.title}`;

    if (bulletinData.id) {
      initialNotifiedAt.current = bulletinData.last_notified_at;
      currentRevision.current = bulletinData.live_revision;
      markBulletinsAsRead([bulletinData], cmsContextRef.current, setCMSContext);
    }

    setShowLoader(false);
  };

  useEffect(() => {
    cmsContextRef.current = cmsContext;
  }, [cmsContext]);

  useEffect(() => {
    loadBulletin();
  }, [params.id]);

  useEffect(() => {
    return () => {
      if (bulletin && bulletin.id) {
        markBulletinsAsRead([bulletin], cmsContextRef.current, setCMSContext);
      }
    };
  }, [bulletin, setCMSContext]);

  let content = bulletin;
  if (content && params.subid) {
    content = bulletin.subpages.filter((sub) => sub.slug === params.subid)[0] || bulletin;
  }

  // Rendering
  return (
    <div className='bulletin-page cms-page'>
        {showUpdateOverlay && (
        <div className="update-overlay">
          <span className="update-overlay__message">
            Bulletin updated just now
          </span>
          <button
            className="update-overlay__close"
            aria-label="Dismiss"
            onClick={() => {
              dismissedNotifiedAt.current = latestNotifiedAt;
              setShowUpdateOverlay(false);
            }}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}
      <PollingComponent runnable={checkForUpdates} interval={5000} />

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
             {isPreview && <span className="preview-badge">Preview</span>}
            <h1 className="page-title">{content.title}</h1>

            {content.teaser &&
              <p className="page-description body--large">{content.teaser}</p>
            }

            {(content.first_published_at || !content.live) &&
              <div className="page-header__title__meta">
                <div className="timestamp-container">
                  <span>
                      {content.live
                        ? content.first_published_at !== content.last_published_at
                          ? "Updated"
                          : "Published"
                        : content.first_published_at !== content.last_published_at
                          ? "Updated"
                          : content !== NOT_FOUND_CONTENT ? "Saved" : ""}
                    </span>
                    { content !== NOT_FOUND_CONTENT && <FriendlyTime date={content.last_notified_at ?? content.last_published_at} /> }
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
