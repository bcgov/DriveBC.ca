// React
import React, { useEffect, useContext } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';
import { useMediaQuery } from "@uidotdev/usehooks";
import Tooltip from 'react-bootstrap/Tooltip';

// Internal imports
import { isRestStopClosed } from '../../data/restStops';
import DmsTypeIcon from '../DmsTypeIcon';
import ShareURLButton from '../../shared/ShareURLButton';
import { MapContext } from '../../../App';
import FriendlyTime from '../../shared/FriendlyTime';

// Styling
import './DmsPanel.scss';

// Helper components
const tooltipLargeVehicles = (
  <Tooltip id="tooltipLargeVehicles" className="tooltip-content">
    <p>A commercial vehicle is defined as one that is larger than 20 metres &#40;66 feet&#41; in length.</p>
  </Tooltip>
);

// Main component
export default function DmsPanel(props) {
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  const { dms, showRouteObjs } = props;

  const dmsData = dms.getProperties();
  const feature = dms;
  const isClosed = isRestStopClosed(dmsData.properties);

  const [searchParams, setSearchParams] = useSearchParams();

  // Context
  const { mapContext } = useContext(MapContext);


  const displays = [
    {
      id: 1,
      status: dms.values_.message_display_1?.trim() ? 'Active' : 'No message',
      messages: [dms.values_.message_display_1]
    },
    {
      id: 2,
      status: dms.values_.message_display_2?.trim() ? 'Active' : 'No message',
      messages: [dms.values_.message_display_2]
    },
    {
      id: 3,
      status: dms.values_.message_display_3?.trim() ? 'Active' : 'No message',
      messages: [dms.values_.message_display_3]
    }
  ];

  // useEffect hooks
  useEffect(() => {
    const featureType = "dms";
    searchParams.set('type', featureType);
    searchParams.set('id', dmsData.id);
    searchParams.delete("display_category");
    setSearchParams(searchParams, { replace: true });
  }, [feature]);

  return (
    <div className={`popup popup--dms ${isClosed ? 'closed' : ''}`} tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
          <DmsTypeIcon dms={dmsData} />
            {isClosed ? (
              <div className='name-div'>
                <p className='name'>Dynamic message sign</p>
              </div>
              ) : (<p className='name'>Dynamic message sign</p>
            )}
        </div>
        <ShareURLButton/>
      </div>
      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{dmsData.name}</p>
          <FriendlyTime date={dmsData.updated_datetime_utc} asDate />          
        </div>

        <div className='popup__content__description'>
          <div className="dms-container">
            {displays.map((display) => (
              <div key={display.id} className="display-item">
                
                {/* Header: Label and Badge */}
                <div className="display-header">
                  <span className="display-label">
                    Display {display.id}
                  </span>
                  <div className={`status-badge ${display.status === 'Active' ? 'status-badge--active' : 'status-badge--inactive'}`}>
                    {display.status}
                  </div>
                </div>

                {/* Black LED Board */}
                {display.messages && display.messages.length > 0 && display.messages[0] != "" && (
                  <div className="black-board">
                    {display.messages.map((line, index) => (
                      <div key={index} className="message-line">
                        {line}
                        {/* This empty span is a common trick to ensure the 
                          justification triggers correctly on all browsers. 
                        */}
                        <span style={{ display: 'inline-block', width: '100%' }}></span>
                      </div>
                    ))}
                  </div>

                )}

              </div>

            ))}

            {/* Sign ID Footer */}
            <div className="sign-id-footer">
              Sign ID: {dms.get('id')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
