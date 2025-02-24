import React, { useContext, useEffect } from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// External imports
import Container from 'react-bootstrap/Container';

// Internal imports
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';
import { AuthContext } from "../App";

// Styling
import './AccountPage.scss';

export default function AccountDeactivatedPage() {

  // Context
  const { authContext } = useContext(AuthContext);

  // Navigation
  const navigate = useNavigate();

  // Redirect to home page if user is logged in
  useEffect(() => {
    if (authContext.username) {
      navigate('/');
    }
  }, [authContext]);

  /* Rendering */
  return (
    <div className="account-deactivated-page">
      <PageHeader
        title="Account Deactivated"
        description="">
      </PageHeader>

      <Container>
        <p>
          <h2>Your account has been deactivated.</h2>
        </p>
        <p>
          As requested, all of your saved cameras, saved routes, and account settings have been removed.
        </p>
        <p>
          You can close this window or continue to use <a href='/'>DriveBC</a> as normal using the links above.
        </p>
      </Container>

      <Footer/>
    </div>
  );
}
