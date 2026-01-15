// React
import React, { useContext, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { faHexagonExclamation } from '@fortawesome/pro-regular-svg-icons';
import parse from 'html-react-parser';

// local imports
import { EmergencyAlertContext } from "../../App";
import PollingComponent from "./PollingComponent";
import { get } from "../data/helper.js";

// Styling
import './EmergencyAlert.scss';


export default function EmergencyAlert() {
  // Context
  const { emergencyAlertContext, setEmergencyAlertContext } = useContext(EmergencyAlertContext);

  // States
  const [emergencyAlert, setEmergencyAlert] = useState();

  // Data functions
  const fetchEmergencyAlert = async () => {
    const data = await get(`${window.API_HOST}/api/cms/emergency-alert/`);

    if (!data || !Array.isArray(data)) { // endpoint returned nothing, distinct from an empty list
      return;
    }

    setEmergencyAlert(data[0]); // empty list will set null
  }

  // Handlers
  const handleClose = () => {
    const id = emergencyAlert.id.toString() + '-' + emergencyAlert.live_revision.toString();
    const read = Array.from(new Set([...emergencyAlertContext, id]));
    localStorage.setItem('emergencyAlertContext', JSON.stringify(read));
    setEmergencyAlertContext(read);
  };

  const id = emergencyAlert
    ? emergencyAlert.id.toString() + '-' + emergencyAlert.live_revision.toString()
    : null;

  /* Main rendering function */
  return (
    <div>
      { emergencyAlert && !emergencyAlertContext.includes(id) &&
        <div className={`fg`}>
          <div className='fg-content'>
            <FontAwesomeIcon icon={faHexagonExclamation} className="fg-exclamation" />
            {parse(emergencyAlert.alert)}
          </div>

          <FontAwesomeIcon icon={faXmark} className="fg-close-btn" onClick={handleClose} onKeyDown={handleClose} tabIndex={0} />
        </div>
      }

      <PollingComponent runnable={fetchEmergencyAlert} interval={60000} runImmediately={true} />
    </div>
  );
}
