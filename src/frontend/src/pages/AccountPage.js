import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Redux
import { useDispatch, useSelector } from "react-redux";
import { memoize } from "proxy-memoize";
import { logoutDispatch } from "../Components/data/account";

// Navigation
import { useNavigate } from 'react-router-dom';

// External imports
import Button from "react-bootstrap/Button";
import Container from 'react-bootstrap/Container';
import Modal from "react-bootstrap/Modal";

// Internal imports
import { AuthContext } from '../App';
import { getCookie } from "../util";
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';

// Styling
import './AccountPage.scss';

export default function AccountPage() {
  /* Setup */
  // Navigation
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);

  // Redux
  const dispatch = useDispatch();
  const { selectedRoute, searchedRoutes } = useSelector(useCallback(memoize(state => ({
    selectedRoute: state.routes.selectedRoute,
    searchedRoutes: state.routes.searchedRoutes,
  }))));

  // Refs
  const showedModal = useRef(false);

  // States
  const [verified] = useState(params.get('verified'));
  const [showDeactivate, setShowDeactivate] = useState(false);

  // Effects
  useEffect(() => {
    if (!authContext.loginStateKnown) {
      return;
    }

    // Show login modal once if user is not logged in
    if (!authContext.username && !showedModal.current) {
      toggleAuthModal('Sign in');
      showedModal.current = true;
    }
  }, [authContext]);

  /* Handlers */
  const deactivateHandler = async () => {
    const url = `${window.API_HOST}/api/users/drivebcuser/${authContext.username}/`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      credentials: 'include'
    });

    if (response.status === 204) {
      // Successfully deleted the user, handle logout or redirect
      setAuthContext({ ...authContext, username: null });
      logoutDispatch(dispatch, selectedRoute, searchedRoutes);
      navigate('/account-deactivated');
    }
  };

  const toggleAuthModal = (action) => {
    setAuthContext((prior) => {
      if (!prior.showingModal) {
        return { ...prior, showingModal: true, action };
      }
      return prior;
    })
  };

  /* Rendering */
  return (
    <div className="account-page">
      <PageHeader
        title="My Account"
        description="">
      </PageHeader>

      {authContext.loginStateKnown && authContext.username && authContext.verified && verified &&
        <div className='verified'>
          You have successfully verified your email address.
        </div>
      }

      <Container>
        {authContext.loginStateKnown && authContext.username &&
          <div className='email-address'>
            <p className='header'>Email Address</p>
            <p className='email'>{authContext.email}</p>

            {!authContext.verified &&
              <p className='not-verified'>
                This email address has not been verified. Email notifications for
                saved routes will be disabled until verification
                is complete.

                <br/>

                <Button
                  className='btn btn-outline-primary'
                  tabIndex={0}
                  onClick={() => navigate('/verify-email')}
                  onKeyDown={() => navigate('/verify-email')}>

                  <b>Verify email address</b>
                </Button>
              </p>
            }
          </div>
        }

        {authContext.loginStateKnown && authContext.username &&
          <Button
            variant="outline-primary" id="deactivate-btn" alt="Deactivate DriveBC account" tabIndex={0}
            onClick={() => setShowDeactivate(true)}
            onKeyDown={(keyEvent) => {
              if (['Enter', 'NumpadEnter', 'Space'].includes(keyEvent.key)) {
                deactivateHandler();
              }
            }}>

            Deactivate DriveBC account
          </Button>
        }

        {authContext.loginStateKnown && !authContext.username &&
          <div className="login-prompt">
            <h3>Login required</h3>

            <p>
              You must be <a href="#" onClick={() => toggleAuthModal("Sign in")}>logged in</a> to view this page.
            </p>
          </div>
        }
      </Container>

      <Footer/>

      {showDeactivate && (
        <Modal show={showDeactivate} onHide={() => setShowDeactivate(false)} id='deactivate-modal'>
          <Modal.Header closeButton>
            <Modal.Title>Deactivate DriveBC account</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <p>
              Deactivating your DriveBC account will <b>remove all saved cameras, saved routes, and all of your account settings. </b>
              This will not affect your BCeID account. Please confirm.
            </p>

            <div className="modal-buttons">
              <Button variant="danger" onClick={deactivateHandler}>Yes, deactivate my account</Button>
              <Button variant="outline-primary" onClick={() => setShowDeactivate(false)}>Cancel</Button>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
