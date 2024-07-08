/* eslint-disable no-unused-vars */
// React
import React, { useState, useContext } from "react";

import { AuthContext } from "./App";
import { getCookie } from "./util";

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

// Styling
import './Modal.scss';


export default function Modal() {

  const { authContext, setAuthContext } = useContext(AuthContext);

  const toggleAuthModal = () => {
    setAuthContext((prior) => {
      return { ...prior, showingModal: !prior.showingModal, action: null }
    })
  };

  if (!authContext.showingModal) {
    return <div />;
  }

  const tooltipBCeID = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>BCeID is a secure login service that allows you to access various government services online.</p>
    </Tooltip>
  );

  return (
    <div className="auth-modal"
      onClick={toggleAuthModal}
    >
      <div className="content"
        onClick={(e) => { e.stopPropagation(); }}
      >
        <div className='header'>
          <FontAwesomeIcon
            id="modal-closer"
            className="modal-closer"
            icon={faXmark}
            onClick={toggleAuthModal}
          />
          <div className='title'>{authContext.action}</div>
        </div>

        <div className='body'>
          { authContext.action === 'Sign In' &&
            <form method='post' action={`${window.API_HOST}/accounts/oidc/bceid/login/`}>
              <input type='hidden' name='csrfmiddlewaretoken' value={getCookie('csrftoken')} />
              <p>Access your saved cameras and routes</p>
              <button type='submit' className="btn btn-outline-primary">Sign in with BCeID</button>
              <div className="BCeID-definition">
                <span>What is a BCeID?</span>
                <OverlayTrigger placement="top" overlay={tooltipBCeID}>
                  <span className="tooltip-info">?</span>
                </OverlayTrigger>
              </div>
            </form>
          }

          { authContext.action === 'Sign Out' &&
            <form method='post' action={`${window.API_HOST}/accounts/logout/`}>
              <input type='hidden' name='csrfmiddlewaretoken' value={getCookie('csrftoken')} />
              <button type='submit' className="btn btn-outline-primary">Sign out of DriveBC</button>
            </form>
          }
        </div>
      </div>
    </div>
  )
}