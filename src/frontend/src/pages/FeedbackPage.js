// React
import React, { useCallback, useEffect, useState } from 'react';

// External Components
import { GoogleReCaptcha } from 'react-google-recaptcha-v3';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

// Styling
import './FeedbackPage.scss';

// Components and functions
import { post } from '../Components/data/helper.js';
import Footer from '../Footer';
import PageHeader from '../PageHeader';

export default function FeedbackPage() {
  document.title = 'DriveBC - Feedback';

  // States
  const [ email, setEmail ] = useState();
  const [ subject, setSubject ] = useState(0);
  const [ message, setMessage ] = useState();
  const [ error, setError ] = useState(false);
  const [ success, setSuccess ] = useState(false);

  // Recaptcha
  const [ recToken, setRecToken ] = useState();
  const refreshRecToken = async () => {
    setRecToken(await executeRecaptcha('feedbackForm'));
  }

  const { executeRecaptcha } = useGoogleReCaptcha();
  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) { // function not ready yet
      return;
    }

    refreshRecToken();
  }, [executeRecaptcha]);

  useEffect(() => {
    handleReCaptchaVerify();
  }, [handleReCaptchaVerify]);

  // Handlers
  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      email: email,
      subject: subject,
      message: message,
      recToken: recToken
    };

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }

    post(`${window.API_HOST}/api/feedback/`, payload, headers)
    .then((data) => {
      setSuccess(true);
    })
    .catch((error) => {
      console.log(error);
      setError(true);

      // Refresh captcha token on error
      refreshRecToken();
    });
  };

  // Rendering
  return (
      <div className='feedback-page'>
      {!success &&
        <React.Fragment>
          <PageHeader
            title='Web feedback, problems, or suggestion'
          >
          </PageHeader>
          <Container>
            <p className="description text-max-width">
              We welcome your input on DriveBC. Please let us know if you have feedback, see a problem, or have a suggestion on how we can improve the site.
            </p>
            <Form onSubmit={handleSubmit}  className="feedback-form text-max-width">
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" placeholder="Enter your email address here" required value={email} onChange={e => setEmail(e.target.value)} />
              </Form.Group>

              <Form.Group>
                <Form.Label>Subject</Form.Label>
                <Form.Control as="select" aria-label="Select subject" value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value={0}>Website Feedback</option>
                </Form.Control>
              </Form.Group>

              <Form.Group>
                <Form.Label>Message</Form.Label>
                <Form.Control as="textarea" rows={5} placeholder="Enter your message here" required value={message} onChange={e => setMessage(e.target.value)} />
              </Form.Group>

              <Button variant="primary" type="submit">
                Send
              </Button>

              {error &&
                <span>Error on submission. Please try again.</span>
              }
            </Form>
          </Container>
        </React.Fragment>
      }

      {success &&
        <React.Fragment>
          <PageHeader
            title='Thank you for your feedback'
          >
          </PageHeader>
          <Container>
            <div>
              <p className="feedback-sent">
                Your feedback has been successfully sent to our team.
                We’ll get back to you as soon as possible usually within 2 business days.
              </p>

              <p className="feedback-wait">
                While you wait, please feel free to explore DriveBC:
              </p>

              <ul>
                <li><a href='/'>Map view</a></li>
                <li><a href='/delays'>Delay listings</a></li>
                <li><a href='/cameras'>Cameras</a></li>
              </ul>
            </div>
          </Container>
        </React.Fragment>
      }

      <Footer />
    </div>
  );
}
