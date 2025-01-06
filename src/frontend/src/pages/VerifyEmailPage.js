// React
import React, { useContext, useEffect } from 'react';

// External imports
import Container from 'react-bootstrap/Container';

// Internal imports
import { AuthContext } from '../App';
import { sendVerificationEmail } from "../Components/data/user";
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';

// Styling
import './VerifyEmailPage.scss';

export default function VerifyEmailPage() {
  const { authContext } = useContext(AuthContext);

  useEffect(() => {
    if (authContext.loginStateKnown && !authContext.verified) {
      sendVerificationEmail();
    }
  }, [authContext]);

  return (
    <div className="verify-email-page">
      <PageHeader
        title="Please verify your email"
        description="">
      </PageHeader>

      <Container>
        <p className='base-instructions'>
          To enable notifications your email account needs to be
          verified. We’ve sent an email to <b>{authContext.email}</b> with
          a link to verify that the account is yours.
        </p>

        <p>
          Once you click on the link, you will be able to receive
          notifications by email for your favourite routes.
        </p>

        <p>
          <b>If you can’t find the email</b>, please check the following:
          <ul>
            <li>double check the spelling of your email address</li>
            <li>check your junk mail folders, and  add</li>
            <li>add {window.FROM_EMAIL} to your whitelist</li>
          </ul>
        </p>

        <button className='btn btn-outline-primary' onClick={sendVerificationEmail} onKeyPress={sendVerificationEmail}>Send another verification Email</button>
      </Container>

      <Footer/>
    </div>
  );
}
