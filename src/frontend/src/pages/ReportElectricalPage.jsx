// React
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Internal imports
import { ReportMap } from '../Components/report/ReportMap';
import Footer from '../Footer';

// External imports
import Container from 'react-bootstrap/Container';
import { useMediaQuery } from '@uidotdev/usehooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft
} from '@fortawesome/pro-solid-svg-icons';

// Styling
import './ReportElectricalPage.scss';

export default function ReportElectricalPage() {
  document.title = `DriveBC - Report Electrical Problem`;

  const xLargeScreen = useMediaQuery('only screen and (min-width : 992px)');

  const navigate = useNavigate();

  const returnHandler = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true }); // the current entry in the history stack will be replaced with the new one with { replace: true }
    }
  };

  // Rendering
  return (
    <div className='report-page report-page--electrical'>
      <div className="page-header">
        <Container>
          <div className="back-link-wrap">
            <a
              className="back-link"
              onClick={returnHandler}
              onKeyDown={keyEvent => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  returnHandler();
                }
              }}>
              <FontAwesomeIcon icon={faArrowLeft} />
              Back
            </a>
          </div>
          <div className="page-header__content">
          <h1 className="page-title">Road electrical problem</h1>
            <p className="page-description body--large">Report an electrical issue on a highway or bridge. Examples include: overhead signs, street lights, pedestrian lighting, signals out, or signals damaged.</p>
            </div>
        </Container>
      </div>

      <div className="report-map-wrap">
        <ReportMap wmsLayer='hwy:DSA_ELECTRICAL_CA_INFO_V' styles='DSA_ELECTRICAL_CA_INFO_V_V2'/>
      </div>

      {xLargeScreen && <Footer />}
    </div>
  );
}
