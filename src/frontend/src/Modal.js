/* eslint-disable no-unused-vars */
// React
import React, { useState, useContext } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

import { AuthContext } from "./App";

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

  return (
    <div className="auth-modal"
      onClick={toggleAuthModal}
    >
      <div className="content"
        onClick={(e) => { e.stopPropagation(); }}
      >
        <div className='header'>
          <div className='title'>{authContext.action}</div>
          <FontAwesomeIcon
            id="modal-closer"
            className="modal-closer"
            icon={faXmark}
            onClick={toggleAuthModal}
          />
        </div>

        <div className='body'>
          { authContext.action === 'Sign In' &&
            <form method='post' action={`${window.API_HOST}/accounts/oidc/bceid/login/`}>
              <p>Access your saved cameras and routes</p>
              <button type='submit'>Sign in with BCeID</button>
            </form>
          }

          { authContext.action === 'Sign Out' &&
            <form method='post' action={`${window.API_HOST}/accounts/logout/`}>
              <button type='submit'>Sign out of DriveBC</button>
            </form>
          }
        </div>
      </div>
    </div>
  )
}