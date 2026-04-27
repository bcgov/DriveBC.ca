// React
import React, { useContext, useEffect, useState } from 'react';

// Navigation
import { useParams, useNavigate } from 'react-router-dom';

// External imports
import Container from 'react-bootstrap/Container';
import Skeleton from 'react-loading-skeleton';
import parse from 'html-react-parser';

// Internal imports
import { CMSContext } from '../../App';
import { get, NetworkError, ServerError } from '../data/helper';
import NetworkErrorPopup from '../map/errors/NetworkError';
import ServerErrorPopup from '../map/errors/ServerError';
import Footer from '../../Footer';
import FriendlyTime from './FriendlyTime';
import ShareURLButton from './ShareURLButton';
import PollingComponent from "./PollingComponent";

// Styling
import './EmergencyAlertDetail.scss';

const NOT_FOUND_CONTENT = {
  title: 'Emergency Alert Detail Not Found',
  teaser: 'There is currently no published emergency alert detail at this URL',
  body: '',
};

export default function EmergencyAlertDetail() {
  /* Setup */
  // Navigation
  const { slug } = useParams();
  const navigate = useNavigate();

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  // States
  const [detailData, setDetailData] = useState(null);
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
  };

  // Navigating back
  const returnHandler = () => {
    navigate(-1);
  };

  // Render body blocks
  const renderBody = (body) => {
    try {
      const blocks = typeof body === 'string' ? JSON.parse(body) : body;
      return blocks.map((block) => {
        if (block.type === 'rich_text') {
          return <div key={block.id}>{parse(block.value)}</div>;
        }
        return null;
      });
    } catch {
      if (typeof body === 'string') {
        return <div>{parse(body)}</div>;
      }
      return null;
    }
  };

  // Data function and initialization
  const loadDetail = async () => {
    try {
      const url = `${globalThis.API_HOST}/api/cms/emergency-alert-detail/${slug}`;
      const data = await get(url);
      if (data) {
        setDetailData(data);
        document.title = `DriveBC - Emergency Alerts - ${data.title}`;

        if (data.id) {
          const readAlerts = Array.from(new Set([
            ...cmsContext.readBulletins,
            data.id.toString() + '-' + ((data.live_revision != null) ? data.live_revision.toString() : '')
          ]));

          const updatedContext = { ...cmsContext, readBulletins: readAlerts };
          setCMSContext(updatedContext);
          localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
        }
      } else {
        setDetailData(NOT_FOUND_CONTENT);
      }
    } catch (error) {
      displayError(error);
      setDetailData(NOT_FOUND_CONTENT);
    }

    setShowLoader(false);
  };

  useEffect(() => {
    loadDetail();
  }, [slug]);

  // Rendering
  return (
    <div className='emergency-alert-detail cms-page'>
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

      <Container className="page-header__title">
        {detailData && !showLoader &&
          <React.Fragment>
            <h1 className="page-title">{detailData.title}</h1>

            {detailData.teaser &&
              <p className="page-description body--large">{detailData.teaser}</p>
            }

            {(detailData.first_published_at || !detailData.live) &&
              <div className="emergency-detail-meta-container">
                <div className="emergency-detail-timestamp-container">
                  {detailData.first_published_at &&
                    <span>
                      Published <FriendlyTime date={detailData.first_published_at} />
                    </span>
                  }
                  {detailData.first_published_at !== detailData.last_published_at && detailData.last_published_at &&
                    <span>
                      Updated <FriendlyTime date={detailData.last_published_at} />
                    </span>
                  }
                </div>
                <ShareURLButton />
              </div>
            }
          </React.Fragment>
        }

        {showLoader &&
          <div>
            <br /><Skeleton width={280} height={36} />
            <br /><Skeleton width={320} height={24} />
            <br /><Skeleton width={240} height={18} />
          </div>
        }
      </Container>

      <Container className="emergency-alert-body-container cms-body">
        {showLoader &&
          <Skeleton height={320} />
        }

        {!showLoader && detailData &&
          <div>{renderBody(detailData.body)}</div>
        }
        <PollingComponent runnable={loadDetail} interval={60000} runImmediately={true} />
      </Container>
      <Footer />
    </div>
  );
}
