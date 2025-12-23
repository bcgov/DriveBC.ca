// React
import React from 'react';

// Third party packages
import Container from 'react-bootstrap/Container';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faEnvelope
} from '@fortawesome/pro-regular-svg-icons';
import {
  faXTwitter,
  faInstagram,
  faLinkedin,
} from '@fortawesome/free-brands-svg-icons';

export default function SocialSharing() {
  return (
  <Container className="social-share-container">
    <div className="social-share-div">
      <p className="bold hero">Share this page</p>
      <div className="social-share">
        <a href="https://twitter.com/DriveBC" className="footer-link" rel="noreferrer"  alt="Twitter">
          <FontAwesomeIcon icon={faXTwitter} />
        </a>
        <a href="https://www.instagram.com/ministryoftranbc/" className="footer-link" rel="noreferrer"  alt="Instagram">
          <FontAwesomeIcon icon={faInstagram}/>
        </a>
        <a href="https://www.linkedin.com/company/british-columbia-ministry-of-transportation-and-infrastructure/" className="footer-link" rel="noreferrer" alt="Linkedin" >
          <FontAwesomeIcon icon={faLinkedin}/>
        </a>
        <a href="" className="footer-link" rel="noreferrer" alt="Email" >
          <FontAwesomeIcon icon={faEnvelope}/>
        </a>
      </div>
    </div>
  </Container>
  );
}
