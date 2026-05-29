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
import './ReportRoadPage.scss';

export default function ReportRoadPage() {
  document.title = `DriveBC - Report Road Maintenance`;

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
    <div className='report-page report-page--road'>
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
            <h1 className="page-title">Highway or bridge problem</h1>
            <p className="page-description body--large">Report highway or bridge problems. Examples include: pot holes, road damage, bridge damage, signage damage, drainage issues, fallen trees, fallen rocks, or animal carcasses.</p>
          </div>
        </Container>
      </div>

      <div className="report-map-wrap">
        <ReportMap wmsLayer='hwy:DSA_CONTRACT_AREA_INFO_V' styles='DSA_CONTRACT_AREA_INFO_V_V2' />
      </div>

      {xLargeScreen && <Footer />}
    </div>
  );
}
