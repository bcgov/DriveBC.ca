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
  const [open, setOpen] = useState(true);

  // Rendering
  return (open) ? (
    <div className={'exit-survey' + (mobile ? ' mobile' : '')}>
      <Button
        className={'exit-survey-close-btn' + (open ? ' open' : '')}
        aria-label="close exit survey banner"
        onClick={() => {
          open ? setOpen(false) : setOpen(true) }
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
          <a className="survey-link" target="_blank" rel="noreferrer" alt="Survey" href="https://forms.office.com/Pages/ResponsePage.aspx?id=AFLbbw09ikqwNtNoXjWa3G-k6A-ZOZVMlxBJti4jf_VURjI4MlRKMlRYQTVFUFJZOU5XTVVZUjEwQS4u" >
          complete our anonymous survey
          </a>
          </p>
        </div>
      </div>
    </div>
  ) : null;
}
