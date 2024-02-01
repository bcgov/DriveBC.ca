import React from 'react';
import './Footer.scss';
import Container from 'react-bootstrap/Container';
import logo from './images/dbc-logo.svg';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import {
  faXTwitter,
  faInstagram,
  faLinkedin,
} from '@fortawesome/free-brands-svg-icons';


export default function Footer(props) {
  const { replay } = props;

  return (
    <div className={"footer-container" + (replay ? ' replayActive' : '')}>
      <div className="landAcknowledgement">
        <Container>
          <p>The B.C. Public Service acknowledges the territories of First Nations around B.C. and is grateful to carry out our work on these lands. We acknowledge the rights, interests, priorities, and concerns of all Indigenous Peoples - First Nations, Métis, and Inuit - respecting and acknowledging their distinct cultures, histories, rights, laws, and governments.</p>
        </Container>
      </div>
      <footer className="footer">
        <div className="flex-container">
          <div className="contact">
            <img className="footer-logo" src={logo} alt="Government of B.C." />
            <p className="footer-text">BC Highways Conditions toll-free in North America: <a href="tel:1-800-550-4997">1-800-550-4997</a> including Telephone Device for the Deaf (TDD) support.</p>
          </div>
          <div className="more-info">
            <h2>More Info</h2>
            <ul className="link-list">
              <li>
                <a href="https://www2.gov.bc.ca/gov/content/home/disclaimer" className="footer-link" target="_self"  alt="Disclaimer" >Disclaimer
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} /></a>
              </li>
              <li>
                <a href="https://www2.gov.bc.ca/gov/content/home/privacy" className="footer-link" target="_self"  alt="Privacy" >Privacy
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} /></a>
              </li>
              <li>
                <a href="https://www2.gov.bc.ca/gov/content/governments/about-the-bc-government/accessibility" className="footer-link" target="_self"  alt="Acccessibility" >Accessibility
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare}/></a>
              </li>
            </ul>
          </div>
        </div>
        <div className='bottom'>
          <div className="connect">
            <a href="https://twitter.com/DriveBC" className="footer-link" target="_blank" rel="noreferrer"  alt="Twitter" aria-hidden="true" aria-label="Twitter">
              <FontAwesomeIcon icon={faXTwitter} />
            </a>
            <a href="https://www.instagram.com/ministryoftranbc/" className="footer-link" target="_blank" rel="noreferrer"  alt="Instagram" aria-hidden="true" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram}/>
            </a>
            <a href="https://www.linkedin.com/company/british-columbia-ministry-of-transportation-and-infrastructure/" className="footer-link" target="_blank" rel="noreferrer" alt="Linkedin" aria-hidden="true" aria-label="Linkedin">
              <FontAwesomeIcon icon={faLinkedin}/>
            </a>
          </div>
          <div className="copyright">© 2023 Government of British Columbia</div>
        </div>
      </footer>
    </div>
  );
}
