// React
import React, { useContext } from "react";

// Internal imports
import { AuthContext } from "./App";
import { getCookie } from "./util";
import { post } from "./Components/data/helper";

// External imports
import { faCircleCheck, faBan, faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Styling
import './Modal.scss';
import './ConsentModal.scss';

export default function ConsentModal(props) {
  /* Setup */
  // Props
  const { setShowConsentModal, postConsentHandler } = props;

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);

  /* Handlers */
  // Handlers
  const handleSubmit = (consent) => {
    if (!consent && authContext.attempted_consent) {
      // Already prompted user before, do nothing
      return;
    }

    const payload = {
      consent: consent
    };

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    }

    post(`${window.API_HOST}/api/users/email-consent/`, payload, headers).then((response) => {
      if (Math.floor(response.status / 100) == 2) {
        setAuthContext((prior) => {
          return {...prior, consent: consent, attempted_consent: true};
        });
      }
    });
  };

  // Main component
  return (
    <div className="shared-modal consent-modal">
      <div className="content">
        <div className={'header-container'}>
          <p>Consent to email</p>
          <FontAwesomeIcon
            icon={faXmark}
            className="close-btn"
            tabIndex={0}
            onClick={() => {
              setShowConsentModal(false);
              handleSubmit(false);
            }}
            onKeyDown={(keyEvent) => {
              if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                keyEvent.stopPropagation();
                setShowConsentModal(false);
                handleSubmit(false);
              }
            }} />
        </div>

        <div className='body'>
          <div className={'form-container'}>
            <p>Do you consent to the email address associated with your account to be used for sending notifications for your saved routes?</p>
            <p>These notifications are completely managed by you and you can configure them to suit your needs for each saved route.</p>

            <div className={'btn-container'}>
              <div
                className="btn btn-primary"
                autoFocus={true}
                tabIndex={0}
                onClick={() => {
                  setShowConsentModal(false);
                  if (postConsentHandler) postConsentHandler();
                  handleSubmit(true);
                }}
                onKeyDown={(keyEvent) => {
                  if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                    keyEvent.stopPropagation();
                    setShowConsentModal(false);
                    if (postConsentHandler) postConsentHandler();
                    handleSubmit(true);
                  }
                }}>
                I consent
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>

              <div
                className="btn btn-primary btn-cancel"
                autoFocus={true}
                tabIndex={0}
                onClick={() => {
                  setShowConsentModal(false);
                  handleSubmit(false);
                }}
                onKeyDown={(keyEvent) => {
                  if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                    keyEvent.stopPropagation();
                    setShowConsentModal(false);
                    handleSubmit(false);
                  }
                }}>
                I do not consent
                <FontAwesomeIcon icon={faBan} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
