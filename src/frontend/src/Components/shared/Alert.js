// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';

// Styling
import './Alert.scss';

export default function Alert(props) {
  const { showAlert, setShowAlert, message } = props;

  /* Main rendering function */
  return showAlert && (
    <div className="alert">
      <div className="content">
        <div className="content__text">
          {message}
        </div>

        <Button
          className={'alert-close-btn'}
          aria-label="close alert banner for copied link"
          onClick={() => setShowAlert(false)}>

          <FontAwesomeIcon icon={faXmark} />
        </Button>
      </div>
    </div>
  );
}
