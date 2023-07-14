import './Footer.scss';
import Container from 'react-bootstrap/Container';
import logo from './images/BCID_H_rgb_pos.png';
import facebook from './images/facebook.svg';
import instagram from './images/instagram.svg';
import twitter from './images/twitter.svg';

export default function Footer() {
  return (
    <div className="footer-container">
      <div className="landAcknowledgement">
        <Container>
          <p>The B.C. Public Service acknowledges the territories of First Nations around B.C. and is grateful to carry out our work on these lands. We acknowledge the rights, interests, priorities, and concerns of all Indigenous Peoples - First Nations, Métis, and Inuit - respecting and acknowledging their distinct cultures, histories, rights, laws, and governments.</p>
        </Container>
      </div>
      <footer className="footer">
        <div className="flex-container">
          <div className="contact">
            <img className="footer-logo" src={logo} alt="Government of B.C." />
            <p>We can help in over 120 languages and through Telephone Device For The Deaf (TDD).&nbsp;<a className="footer-link-grey" href="/gov/content/home/get-help-with-government-services">Call, email or text us</a>, or&nbsp;<a className="footer-link-grey" href="/gov/content/home/services-a-z">find a service centre</a></p>
          </div>
          <div className="more-info">
            <h2>More Info</h2>
            <ul className="link-list">
              <li><a href="/gov/content/home" className="footer-link" target="_self">Home</a></li>
              <li><a href="/gov/content/about-gov-bc-ca" className="footer-link" target="_self">About gov.bc.ca</a></li>
              <li><a href="/gov/content/about-gov-bc-ca/alpha-gov" className="footer-link" target="_self">About Alpha Gov</a></li>
              <li><a href="/gov/content/home/disclaimer" className="footer-link" target="_self">Disclaimer</a></li>
              <li><a href="/gov/content/home/privacy" className="footer-link" target="_self">Privacy</a></li>
              <li><a href="/gov/content/home/accessible-government" className="footer-link" target="_self">Accessibility</a></li>
              <li><a href="/gov/content/home/copyright" className="footer-link" target="_self">Copyright</a></li>
              <li><a href="/gov/content/home/get-help-with-government-services" className="footer-link" target="_self">Contact us</a></li>
            </ul>
          </div>
        </div>
        <div className='bottom'>
          <div className="connect">
            <a href="https://www.facebook.com/BCProvincialGovernment" className="footer-link" target="_blank" rel="noreferrer">
              <img src={facebook} alt="Facebook" />
            </a>
            <a href="https://www.instagram.com/governmentofbc" className="footer-link" target="_blank" rel="noreferrer">
              <img src={instagram} alt="Instagram" />
            </a>
            <a href="https://twitter.com/BCGovNews" className="footer-link" target="_blank" rel="noreferrer">
              <img src={twitter} alt="Twitter" />
            </a>
          </div>
          <div className="copyright">© 2023 Government of British Columbia</div>
        </div>
      </footer>
    </div>
  )
}
