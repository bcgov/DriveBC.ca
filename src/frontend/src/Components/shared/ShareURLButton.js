// React
import React, { useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { faShareFromSquare } from '@fortawesome/pro-regular-svg-icons';
import Button from 'react-bootstrap/Button';

// Styling
import './ShareURLButton.scss';

export default function ShareURLButton() {
  const [showAlert, setShowAlert] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        console.log('URL copied to clipboard');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });

    setShowAlert(true);

    setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  };

  /* Main rendering function */
  return (
    <div className="share-url">
      <button className="copy-btn" onClick={copyToClipboard}>
        <FontAwesomeIcon icon={faShareFromSquare} />
        <span>Share</span>
      </button>

      {showAlert && (
        <div className="alert">
          <div className="content">
            <div className="content__icon">
              <div className="square-icon">
                <FontAwesomeIcon icon={faCopy} />
              </div>
            </div>

            <div className="content__text">
              <p className="bold blue-text">Page URL copied to clipboard</p>
              <p className="blue-text">You can paste it anywhere (email, social media, etc.) to share this page.</p>
            </div>

            <Button
              className={'alert-close-btn'}
              aria-label="close alert banner for copied link"
              onClick={() => setShowAlert(false)}>

              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
