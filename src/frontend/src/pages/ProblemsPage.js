import React from 'react';
import './ProblemsPage.scss';
import Container from 'react-bootstrap/Container';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import { Link } from 'react-router-dom';

const ProblemsPage = () => {
  return (
    <div className="report-problem">
      <PageHeader title='Report a problem'>
      </PageHeader>
      
      <Container className='text-container'>
        <div className="report-problem">
          <div className="problem-categories">
            <Link to="/website-problem" className="category">
              <div className="category-icon"></div>
              <h2>Website problem or suggestion</h2>
              <p>
                Report site feedback, suggestions, or bugs related to the new DriveBC website.
                <br />
                <i>This feature is currently not available in Beta. Use the Feedback link in the website header to provide feedback.</i>
              </p>
            </Link>
            <Link to="/highway-problem" className="category">
              <div className="category-icon"></div>
              <h2>Highway or bridge problem</h2>
              <p>
                Report highway or bridge problems. Examples include: pot holes, road damage, bridge damage, signage damage,
                drainage issues, fallen trees, fallen rocks, or animal carcasses.
              </p>
            </Link>
            <Link to="/road-electrical-problem" className="category">
              <div className="category-icon"></div>
              <h2>Road electrical problem</h2>
              <p>
                Report an electrical issue on a highway or bridge. Examples include: overhead signs, street lights, pedestrian
                lighting, signals out, or signals damaged.
              </p>
            </Link>
          </div>
          <div className="emergency-contacts">
            <div className="contact">
              <div className="contact-icon"></div>
              <p><strong>Report a downed power line</strong><br /><span className='underline'>1-888-769-3766</span></p>
            </div>
            <div className="contact">
              <div className="contact-icon"></div>
              <p><strong>Report a wildfire</strong><br /><span className='underline'>1-800-663-5555</span></p>
            </div>
            <div className="contact">
              <div className="contact-icon"></div>
              <p><strong>Report a chemical spill</strong><br /><span className='underline'>1-800-663-3456</span></p>
            </div>
          </div>
        </div>
      </Container>
      <Footer />
      
    </div>
  );
};

export default ProblemsPage;
