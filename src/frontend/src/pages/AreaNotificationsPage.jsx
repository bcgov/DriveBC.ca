// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// External imports
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Skeleton from 'react-loading-skeleton';

// Internal imports
import { AuthContext } from '../App';
import AreaNotificationCard from '../Components/areaNotifications/AreaNotificationCard';
import Footer from '../Footer';
import PageHeader from '../PageHeader';

// Styling
import './AreaNotificationsPage.scss';

export default function AreaNotificationsPage() {
  /* Setup */
  document.title = 'DriveBC - Area notifications';

  // Navigation
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);

  // Redux
  const { areas, emailSubscriptions } = useSelector(useCallback(memoize(state => ({
    areas: state.feeds.areas.list,
    emailSubscriptions: state.user.emailSubscriptions,
  }))));

  // Refs
  const showedModal = useRef(false);

  // States
  const [verified] = useState(params.get('verified'));

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
    <div className="area-notifications-page">
      <PageHeader
        title="My areas"
        description="Manage your notifications over larger areas of B.C. Toggling on an area notification sends notifications for information you’re interested in for the whole area.">
      </PageHeader>

      {authContext.loginStateKnown && authContext.username && !authContext.verified && authContext.attempted_verification &&
        <div className="not-verified">
          {authContext.email} has not been verified. Email notifications for areas will be disabled until
          verification is complete.

          <br className="hidden-desktop" />

          <Button
            className="btn btn-outline-primary verify-link"
            tabIndex={0}
            onClick={() => navigate('/verify-email')}
            onKeyDown={() => navigate('/verify-email')}>

            <b>Verify email address</b>
          </Button>
        </div>
      }

      {authContext.loginStateKnown && authContext.username && authContext.verified && verified &&
        <div className="verified">
          You have successfully verified your email address.
        </div>
      }

      {authContext.loginStateKnown && authContext.username &&
        <Container className="content-container">
          {!areas || emailSubscriptions === null ?
            <div className="area-list">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} height={260} />
              ))}
            </div> :

            <div className="area-list">
              {areas.map(area => (
                <AreaNotificationCard key={area.id} area={area} />
              ))}
            </div>
          }
        </Container>
      }

      {authContext.loginStateKnown && !authContext.username &&
        <Container>
          <div className="login-prompt">
            <h3>Login required</h3>

            <p>
              You must be <a href="#" onClick={() => toggleAuthModal('Sign in')}>logged in</a> to view this page.
            </p>
          </div>
        </Container>
      }

      <Footer />
    </div>
  );
}
