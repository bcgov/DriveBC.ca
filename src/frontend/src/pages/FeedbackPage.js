// React
import React, { useEffect, useState } from 'react';

// Routing
import { useNavigate } from "react-router-dom";

// External Components
import { UAParser } from "ua-parser-js";
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';

// Styling
import './FeedbackPage.scss';

// Internal imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/pro-regular-svg-icons";
import { getCookie } from "../util";
import { post } from '../Components/data/helper.js';
import { useRecaptchaVerification } from "../Components/shared/hooks/reCAPTCHA";
import Footer from '../Footer';
import PageHeader from '../PageHeader';

export default function FeedbackPage() {
  /* Setup */
  // Misc
  document.title = 'DriveBC - Feedback';

  // reCAPTCHA
  const { checkRecaptcha, getRecaptchaAPIToken } = useRecaptchaVerification();

  // Navigation
  const navigate = useNavigate();

  // States
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    os: "",
    browser: "",
    device: "",
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });
	const [validated, setValidated] = useState(false);

  // Effects
  // Device info
  useEffect(() => {
    // Parse user agent
    const parser = new UAParser();
    const result = parser.getResult();

    // Update state with device, OS, and browser info
    setDeviceInfo({
      os: result.os.name + " " + result.os.version,
      browser: result.browser.name + " " + result.browser.version,
      device: result.device.model || "Desktop",
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    });

    // Update screen dimensions on resize
    const handleResize = () => {
      setDeviceInfo((prev) => ({
        ...prev,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      }));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Handlers
  const handleSubmit = async (event) => {
    event.preventDefault();

		const form = event.currentTarget;
		setValidated(true);
		if (form.checkValidity() === false) {
			event.stopPropagation();
      return;
		}

    // Recaptcha
    const reCAPTCHAValid = await checkRecaptcha();
    if (!reCAPTCHAValid) {
      setError(true);
      return;
    }

    const recToken = await getRecaptchaAPIToken('feedbackForm');
    const payload = {
      email: email,
      subject: subject,
      message: message,
      recToken: recToken,
      deviceInfo: deviceInfo,
    };

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    }

    post(`${window.API_HOST}/api/feedback/`, payload, headers)
    .then((data) => {
      setSuccess(true);
    })
    .catch((error) => {
      setError(true);
    });
  };

  const returnHandler = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true }); // the current entry in the history stack will be replaced with the new one with { replace: true }
    }
  };

  /* Rendering */
  // Main component
  return (
    <div className='feedback-page'>
      {!success &&
        <React.Fragment>
          <PageHeader title='Web feedback, problems, or suggestion' returnHandler={returnHandler} />

          <Container>
            <p className="description text-max-width">
              We welcome your input on DriveBC. Please let us know if you have feedback, see a problem, or have a suggestion on how we can improve the site.
            </p>

            <Form noValidate validated={validated} onSubmit={handleSubmit} className="feedback-form text-max-width">
              {error &&
                <div className="submit-error">
                  <span>{"We're having trouble submitting your feedback. Here are some suggestions you can try:"}</span>
                  <ul>
                    <li><b>Wait a couple of minutes and try sending
                      again. </b>{"Sometimes it's temporary and trying at a different time works."}</li>
                    <li><b>Refresh the page and try sending again. </b>{"A quick page refresh may resolve the issue."}
                    </li>
                  </ul>
                  <span>If the problem continues, please email your report directly to us at <a
                    href="mailto:DriveBC@gov.bc.ca">DriveBC@gov.bc.ca</a>. We appreciate your patience and want to hear from you.</span>
                </div>
              }

              <Form.Group controlId="validationEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email address here"
                  required
                  value={email}
                  isInvalid={
                    validated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                  }
                  onChange={e => setEmail(e.target.value)} />

                <Form.Control.Feedback type="invalid">
                  Please provide a valid email address.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className={'subject-select'}>
                <Form.Label>Subject</Form.Label>

                <div className={'dropdown-container'}>
                  <Form.Control as="select" aria-label="Select subject" value={subject} onChange={e => setSubject(e.target.value)}>
                    <option value={0}>Website Feedback</option>
                    <option value={1}>Website problem or bug</option>
                    <option value={2}>Webcam not working or delayed</option>
                  </Form.Control>

                  <FontAwesomeIcon icon={faChevronDown} />
                </div>
              </Form.Group>

              <Form.Group controlId="validationMessage">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="Enter your message here"
                  required
                  minLength={10}
                  maxLength={200}
                  value={message}
                  isInvalid={
                    validated && (message.length < 10 || message.length > 200)
                  }
                  isValid={
                    validated && message.length >= 10 && message.length <= 200
                  }
                  onChange={e => setMessage(e.target.value)} />

                <Form.Control.Feedback type="invalid">
                  Your message must include at least 10-200 characters of description.
                </Form.Control.Feedback>
              </Form.Group>

              <Button variant="primary" type="submit">
                Send
              </Button>
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
