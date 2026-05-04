// React
import React, { useEffect, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';

// Styling
import './Alert.scss';

export default function Alert(props) {
  /* Setup */
  // Props
  const { alertMessage, closeAlert } = props;

  // States
  const [visible, setVisible] = useState(false);
  const [renderedAlertMessage, setRenderedAlertMessage] = useState(alertMessage);

  // Effects
  useEffect(() => {
    // Do not update on closing
    if (alertMessage) {
      setVisible(true);
      setRenderedAlertMessage(alertMessage);

    } else {
      setVisible(false);
    }
  }, [alertMessage]);

  /* Main rendering function */
  return renderedAlertMessage && (
    <div className={`alert fade-out ${!visible ? 'hidden' : ''}`}>
      <div className="content">
        <div className="content__text">
          {renderedAlertMessage}
        </div>

        <Button
          className={'alert-close-btn'}
          aria-label="close alert banner for copied link"
          onClick={closeAlert}>

          <FontAwesomeIcon icon={faXmark} />
        </Button>
      </div>
    </div>
  );
}
