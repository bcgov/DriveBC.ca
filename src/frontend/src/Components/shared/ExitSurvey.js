// React
import React, { useState } from 'react';

// Third party packages
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faComment,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';

// Styling
import './ExitSurvey.scss';

export default function ExitSurvey({ mobile=false }) {

  // States
  const [show, setShow] = useState(true);

  const surveyLink = `${window.SURVEY_LINK}` ||
    'https://forms.office.com/Pages/ResponsePage.aspx?id=AFLbbw09ikqwNtNoXjWa3G-k6A-ZOZVMlxBJti4jf_VURjI4MlRKMlRYQTVFUFJZOU5XTVVZUjEwQS4u';

  // Rendering
  return (show && (sessionStorage.getItem('exit-survey') === null)) ? (
    <div className={'exit-survey' + (mobile ? ' mobile' : '')}>
      <Button
        className={'exit-survey-close-btn' + (show ? ' show' : '')}
        aria-label="close banner for DriveBC beta feedback survey"
        onClick={() => {
          sessionStorage.setItem('exit-survey', true);
          show ? setShow(false) : setShow(true) }
        }>
        <FontAwesomeIcon icon={faXmark} />
      </Button>

      <div className="content">
        <div className="content__icon">
          <div className="square-icon">
            <FontAwesomeIcon icon={faComment} />
          </div>
        </div>
        <div className="content__text">
          <p className="bold blue-text">Thank you for checking out the new DriveBC beta!</p>
          <p className="feedback"><span>We&apos;d love to hear your feedback on your experience using the new site. Please take a few minutes to </span>
          <a className="survey-link" target="_blank" rel="noreferrer" aria-label="complete our anonymous survey and give feedback on the new DriveBC beta" href={surveyLink} >
          complete our anonymous survey
          </a>
          </p>
        </div>
      </div>
    </div>
  ) : null;
}
