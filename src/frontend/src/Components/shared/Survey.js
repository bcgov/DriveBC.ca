// React
import React, { useEffect, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComment,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';

// Internal imports
import { getCookie } from "../../util";
import { post } from "../data/helper";
import { useRecaptchaVerification } from "./hooks/reCAPTCHA";

// Styling
import './Survey.scss';
import Form from "react-bootstrap/Form";

export default function Survey() {
  /* Setup */
  const { checkRecaptcha, getRecaptchaAPIToken } = useRecaptchaVerification();

  // States
  const [visible, setVisible] = useState(false);
  const [validated, setValidated] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  // Effects
  useEffect(() => {
    const surveyTime = localStorage.getItem('surveyTime');
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    if (!surveyTime || (Date.now() - parseInt(surveyTime, 10)) > thirtyDaysInMs) {
      setTimeout(() => {
        setVisible(true);
      }, 120000); // 2 minutes
    }
  }, []);

  /* Handlers */
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

    const recToken = await getRecaptchaAPIToken('postVisitSurvey');
    const payload = {
      email: email,
      recToken: recToken,
    };

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    }

    post(`${window.API_HOST}/api/survey/`, payload, headers).then(() => {
      localStorage.setItem('surveyTime', Date.now().toString());
      setSuccess(true);
      setError(false);

      // On success, set time immediately and hide survey after 5 seconds
      localStorage.setItem('surveyTime', Date.now().toString());
      setTimeout(() => {
        setVisible(false);
      }, 5000);

    }).catch(() => {
      setError(true);
    });
  };

  const closeHandler = () => {
    setVisible(false);

    // Do not hide survey if there was an error
    if (!error) {
      localStorage.setItem('surveyTime', Date.now().toString());
    }
  }

  /* Main rendering function */
  return visible && (
    <div className='survey fade-out'>
      <div className="survey__row">
        <div className="icon">
          <FontAwesomeIcon icon={faComment}/>
        </div>

        {!success &&
          <div className="content">
            <div className="content__header">
              <div className="content__header__text">
                {"We'd love to hear from you!"}
              </div>

              <Button
                className={'survey-close-btn'}
                aria-label="close survey button"
                onClick={() => closeHandler()}
                onKeyDown={() => closeHandler()}
                tabIndex={0}>

                <FontAwesomeIcon icon={faXmark}/>
              </Button>
            </div>

            <div className="content__description">
              Enter your email and we’ll send you a link to a brief 2-minute survey about your visit.
            </div>
          </div>
        }

        {success &&
          <div className="content">
            <div className="content__header">
              <div className="content__header__text">
                Thank you!
              </div>

              <Button
                className={'survey-close-btn'}
                aria-label="close survey button"
                onClick={() => closeHandler()}
                onKeyDown={() => closeHandler()}
                tabIndex={0}>

                <FontAwesomeIcon icon={faXmark}/>
              </Button>
            </div>

            <div className="content__description">
              A link to the survey has been sent to the email address you provided.
            </div>
          </div>
        }
      </div>

      {!success &&
        <Form noValidate validated={validated} onSubmit={handleSubmit}
              className="survey__row survey-form text-max-width">
          <Form.Group controlId="validationEmail" className="form-group">
            <Form.Control
              type="email"
              placeholder="Your email address"
              required
              value={email}
              isInvalid={
                validated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
              }
              onChange={e => setEmail(e.target.value)}/>
          <button type='submit' className="btn btn-outline-primary">Send survey</button>
            <Form.Control.Feedback type="invalid">
              Please provide a valid email address.
            </Form.Control.Feedback>
          </Form.Group>


        </Form>
      }

      {error && !success &&
        <div className="submit-error">
          <span>{"We're having trouble submitting your feedback. You can try:"}</span>
          <ul>
            <li>Refreshing the page or waiting a couple of minutes and try sending again.</li>
            <li>Request the survey directly by sending an email to <a href="mailto:MOTIDriveBC@gov.bc.ca">MOTIDriveBC@gov.bc.ca</a>.</li>
          </ul>
          <span>Thank you for your patience.</span>
      </div>
      }
    </div>
  );
}
