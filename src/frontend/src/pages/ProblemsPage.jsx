// React
import React from 'react';
import { Link } from 'react-router-dom';

// External imports
import Container from 'react-bootstrap/Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxBallot,
  faBridge,
  faPlug,
  faFlask
} from '@fortawesome/pro-regular-svg-icons';

// Internal imports
import Footer from '../Footer';
import PageHeader from '../PageHeader';


// Styling
import './ProblemsPage.scss';

const ProblemsPage = () => {
  return (
    <div className="report-problem-page">
      <PageHeader title='Report a problem'>
      </PageHeader>

      <Container>
        <div className="report-problem">
          <div className="section section--online">
            <div className="section__content">
              <Link to="/feedback" className="content-card content-card--feedback">
                <div className="circle-icon">
                  <FontAwesomeIcon icon={faBoxBallot} />
                </div>
                <h3>Website problem or suggestion</h3>
                <p>Report website feedback, suggestions, or bugs related to the new DriveBC website.</p>
              </Link>

              <Link to="/highway-problem" className="content-card content-card--highway">
                <div className="circle-icon">
                  <FontAwesomeIcon icon={faBridge} />
                </div>
                <h3>Highway or bridge problem</h3>
                <p>Report highway or bridge problems. Examples include:</p>
                <ul>
                  <li>Pot holes</li>
                  <li>Road, bridge, and signage damage</li>
                  <li>Drainage issues</li>
                  <li>Fallen rocks and trees</li>
                  <li>Animal carcasses</li>
                </ul>
              </Link>

              <Link to="/road-electrical-problem" className="content-card content-card--electrical">
                <div className="circle-icon">
                  <FontAwesomeIcon icon={faPlug} />
                </div>
                <h3>Road electrical problem</h3>
                <p>Report electrical issues on a highway or bridge. Examples include:</p>
                <ul>
                  <li>Overhead signs</li>
                  <li>Street lights</li>
                  <li>Pedestrian lighting</li>
                  <li>Signal outages and damages</li>
                </ul>
              </Link>
            </div>
          </div>

          <div className="section section--phone">
            <div className="section__content">
              <a href="tel:1-800-663-5555" className="content-card content-card--wildfire">
                <div className="circle-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="38" viewBox="0 0 32 38" fill="none">
                    <path d="M0.00134277 22.1706C-0.0708885 16.6567 2.7783 10.8471 7.69802 7.99054L8.13763 8.66611C9.34697 10.1294 10.4467 10.5793 11.986 10.5793C14.5155 10.5793 16.4945 8.55394 16.4945 5.85305V0C16.4945 0 32 8.21488 32 21.755C32 30.5372 25.1091 37.459 17.1648 38V31.9068H23.0979L18.552 24.0957H20.9668L15.9955 16.4495L11.032 24.0957H13.4403L8.90086 31.9068H14.8339V37.9789C6.39717 37.2862 0.104486 30.0873 4.00543e-05 22.1706H0.00134277Z" fill="white"/>
                  </svg>
                </div>
                <h4>Report a wildfire</h4>
                <p>BC Wildfire Management Branch</p>
                <p className="tel-number bold">1-800-663-5555</p>
              </a>
              <a href="tel:1-800-663-3456" className="content-card content-card--chemical">
                <div className="circle-icon">
                  <FontAwesomeIcon icon={faFlask} />
                </div>
                <h4>Report a fuel or chemical spill</h4>
                <p>Emergency Management BC</p>
                <p className="tel-number bold">1-800-663-3456</p>
              </a>
            </div>
          </div>
        </div>
      </Container>
      <Footer />

    </div>
  );
};

export default ProblemsPage;
