import React, {useContext, useEffect, useRef, useState} from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// External imports
import Button from "react-bootstrap/Button";
import Container from 'react-bootstrap/Container';

// Internal imports
import { AuthContext } from '../App';
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

  // Refs
  const showedModal = useRef(false);

  // States
  const [verified, setVerified] = useState(params.get('verified'));

  // Effects
  useEffect(() => {
    if (!authContext.loginStateKnown) {
      return;
    }

    // Show login modal once if user is not logged in
    if (!authContext.username && !showedModal.current) {
      toggleAuthModal("Sign In");
      showedModal.current = true;
    }
  }, [authContext]);

  /* Handlers */
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

            {!authContext.verified && authContext.attempted_verification &&
              <p className='not-verified'>
                This email address has not been verified. Email notifications for
                saved routes will be disabled until verification
                is complete.

                <br/>

                <Button
                  className='btn btn-outline-primary'
                  tabIndex={0}
                  onClick={() => navigate('/verify-email')}
                  onKeyPress={() => navigate('/verify-email')}>

                  <b>Verify email address</b>
                </Button>
              </p>
            }
          </div>
        }

        {authContext.loginStateKnown && !authContext.username &&
          <div className="login-prompt">
            <h3>Login required</h3>

            <p>
              You must be <a href="#" onClick={() => toggleAuthModal("Sign In")}>logged in</a> to view this page.
            </p>
          </div>
        }
      </Container>

      <Footer/>
    </div>
  );
}
