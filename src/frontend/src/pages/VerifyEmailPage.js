// React
import React, { useContext, useEffect } from 'react';

// External imports
import Container from 'react-bootstrap/Container';

// Internal imports
import { AlertContext, AuthContext } from '../App';
import { sendVerificationEmail } from "../Components/data/user";
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';

// Styling
import './VerifyEmailPage.scss';

export default function VerifyEmailPage() {
  /* Setup */
  const { authContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);

  /* Effects */
  useEffect(() => {
    if (authContext.loginStateKnown && !authContext.verified) {
      sendEmailWithRoute();
    }
  }, [authContext]);

  /* Helpers */
  const sendEmailWithRoute = () => {
    const params = new URLSearchParams(window.location.search);
    const myRoutes = params.get('my_routes') === 'true';
    sendVerificationEmail({ my_routes: myRoutes });
  }

  /* Handlers */
  const sendVerificationEmailHandler = () => {
    sendEmailWithRoute();
    setAlertMessage(<p>Verification email sent</p>);
  }

  /* Rendering */
  return (
    <div className="verify-email-page">
      <PageHeader
        title="Please verify your email"
        description="">
      </PageHeader>

      <Container>
        <p className='base-instructions'>
          To enable notifications, your email account needs to be
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
            <li>check your junk mail folders, and</li>
            <li>add {window.FROM_EMAIL} to your whitelist</li>
          </ul>
        </p>

        <button className='btn btn-outline-primary' onClick={sendVerificationEmailHandler} onKeyDown={sendVerificationEmailHandler}>Send another verification Email</button>
      </Container>

      <Footer/>
    </div>
  );
}
