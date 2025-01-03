import React, { useContext, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

// External imports
import Container from 'react-bootstrap/Container';

// Internal imports
import { AuthContext } from '../App';
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';

// Styling
import './AccountPage.scss';

export default function AccountPage() {
  const { authContext } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (authContext.loginStateKnown && !authContext.username) {
      navigate('/');
    }
  }, [authContext]);

  return (
    <div className="account-page">
      <PageHeader
        title="My Account"
        description="">
      </PageHeader>

      <Container>
        <div className='email-address'>
          <p className='header'>Email Address</p>
          <p className='email'>{authContext.email}</p>

          {!authContext.verified &&
            <p className='not-verified'>
              This email address has not been verified. Email notifications for
              saved routes will be disabled until verification
              is complete.
            </p>
          }
        </div>
      </Container>

      <Footer/>
    </div>
  );
}
