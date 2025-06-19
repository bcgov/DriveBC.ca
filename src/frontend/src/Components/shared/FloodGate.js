// React
import React, { useContext, useEffect, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { faHexagonExclamation } from '@fortawesome/pro-regular-svg-icons';
import { getFloodGate, markFloodGateAsRead } from "../data/floodgate";
import parse from 'html-react-parser';

// Styling
import './FloodGate.scss';
import { CMSContext } from "../../App";
import PollingComponent from "./PollingComponent";

export default function FloodGate() {
  /* Setup */
  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  // States
  const [visible, setVisible] = useState(true);
  const [floodGate, setFloodGate] = useState();

  // Data functions
  const fetchFloodGate = async () => {
    const data = await getFloodGate();
    if (!data || data.length === 0) {
      return;
    }

    // If the floodgate is already read, do not show it
    const floodGateId = data[0].id.toString() + '-' + data[0].live_revision.toString();
    if (cmsContext.readFloodGates && cmsContext.readFloodGates.includes(floodGateId)) {
      return;
    }

    setFloodGate(data[0]);
  };

  // Handlers
  const handleClose = () => {
    markFloodGateAsRead([floodGate], cmsContext, setCMSContext);
    setVisible(false);
  };

  // Effects
  useEffect(() => {
    fetchFloodGate();
  }, []);

  /* Main rendering function */
  return (
    <div>
      {visible && floodGate &&
        <div className={`fg`}>
          <div className='fg-content'>
            <FontAwesomeIcon icon={faHexagonExclamation} className="fg-exclamation" />
            {parse(floodGate.body)}
          </div>

          <FontAwesomeIcon icon={faXmark} className="fg-close-btn" onClick={handleClose} onKeyPress={handleClose} tabIndex={0} />
        </div>
      }

      <PollingComponent runnable={() => fetchFloodGate()} interval={60000} />
    </div>
  );
}
