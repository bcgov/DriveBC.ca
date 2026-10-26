// React
import React, { useCallback, useContext, useRef, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { faHexagonExclamation } from '@fortawesome/pro-regular-svg-icons';
import parse from 'html-react-parser';

// local imports
import { EmergencyAlertContext } from "../../App";
import PollingComponent from "./PollingComponent";
import { get } from "../data/helper";
import { API_HOST } from '../../env';

// Styling
import './EmergencyAlert.scss';

// DBC22-7044: CMS "Copy Preview URL" adds ?emergency_alert_preview=<slug>
const previewSlug = new URLSearchParams(window.location.search).get('emergency_alert_preview');

export default function EmergencyAlert() {
  // Context
  const { emergencyAlertContext, setEmergencyAlertContext } = useContext(EmergencyAlertContext);

  // States
  const [emergencyAlert, setEmergencyAlert] = useState();
  const resizeObserverRef = useRef(null);

  // Data functions
  const fetchEmergencyAlert = async () => {
    if (previewSlug) {
      const data = await get(`${API_HOST}/api/cms/emergency-alert/${previewSlug}/?preview=true&timestamp=${Date.now()}`);
      setEmergencyAlert(data?.id ? data : null);
      return;
    }

    const data = await get(`${API_HOST}/api/cms/emergency-alert/`);

    if (!data || !Array.isArray(data)) { // endpoint returned nothing, distinct from an empty list
      return;
    }

    setEmergencyAlert(data[0]); // empty list will set null
  }

  // Handlers
  const handleClose = () => {
    if (previewSlug) {
      setEmergencyAlert(null);
      return;
    }

    const id = emergencyAlert.id.toString() + '-' + emergencyAlert.live_revision.toString();
    const read = Array.from(new Set([...emergencyAlertContext, id]));
    localStorage.setItem('emergencyAlertContext', JSON.stringify(read));
    setEmergencyAlertContext(read);
  };

  // Expose .fg height for layout offsets (e.g. filters-menu)
  const fgRef = useCallback((node) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    if (!node) {
      document.documentElement.style.removeProperty('--fg-height');
      return;
    }

    const sync = () => {
      document.documentElement.style.setProperty('--fg-height', `${node.getBoundingClientRect().height}px`);
    };
    sync();
    resizeObserverRef.current = new ResizeObserver(sync);
    resizeObserverRef.current.observe(node);
  }, []);

  const id = emergencyAlert
    ? `${emergencyAlert.id}-${emergencyAlert.live_revision}`
    : null;

  /* Main rendering function */
  return (
    <div>
      { emergencyAlert && (previewSlug || !emergencyAlertContext.includes(id)) &&
        <div className={`fg`} ref={fgRef}>
          <div className='fg-content'>
            <FontAwesomeIcon icon={faHexagonExclamation} className="fg-exclamation" />
            <span>
              {parse(emergencyAlert.alert)}
              {emergencyAlert.detail_url && (
                <>
                  {' '}
                  <a href={emergencyAlert.detail_url} className="fg-detail-link">
                    Learn more
                  </a>
                </>
              )}
            </span>
          </div>

          <button
            type="button"
            className="fg-close-btn"
            aria-label="Close emergency alert"
            onClick={handleClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      }

      <PollingComponent runnable={fetchEmergencyAlert} interval={60000} runImmediately={true} />
    </div>
  );
}
