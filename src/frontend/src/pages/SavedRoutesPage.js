// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarOutline, faXmark } from '@fortawesome/pro-regular-svg-icons';

// Internal imports
import { AuthContext } from '../App';
import CameraList from '../Components/cameras/CameraList';
import Container from 'react-bootstrap/Container';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import RouteDetails from '../Components/routing/RouteDetails';

// Styling
import './SavedRoutesPage.scss';

export default function SavedRoutesPage() {
  /* Setup */
  document.title = 'DriveBC - My Routes';

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);

  // Redux
  const { favRoutes } = useSelector(useCallback(memoize(state => ({
    favRoutes: state.user.favRoutes
  }))));

  // Refs
  const showedModal = useRef(false);

  // States
  const [routeLabel, setRouteLabel] = useState();
  const [routeFavCams, setRouteFavCams] = useState(false);

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
  // Main component
  return (
    <div className="saved-routes-page">
      <PageHeader
        title="My routes"
        description="Manage and view your saved routes here.">
      </PageHeader>

      {authContext.loginStateKnown && authContext.username &&
        <Container className="content-container">
          {!(favRoutes && favRoutes.length) &&
            <div className="empty-routes-display">
              <h3>No saved routes</h3>

              <p>
              You don&apos;t have any saved routes yet. You can add a saved route by searching for a &apos;From&apos; and &apos;To&apos; location on the map and clicking the save route button &#40;<FontAwesomeIcon icon={faStarOutline} />&#41;.
              </p>
            </div>
          }

          {!routeFavCams &&
            <div className={`route-list ${routeFavCams ? 'collapsed' : ''}`}>
              {favRoutes && favRoutes.length > 0 &&
                favRoutes.map(route => (
                  <div key={route.id} className='route-card'>
                    <RouteDetails route={route} setRouteFavCams={setRouteFavCams} setRouteLabel={setRouteLabel} />
                  </div>
                ))
              }
            </div>
          }

          {routeFavCams &&
            <div className="fav-cams-on-route">
              <div className="space-between-row header-row">
                <p className="caption">Showing your favourite cameras along {routeLabel}</p>
                <FontAwesomeIcon className="close-btn" icon={faXmark} onClick={() => setRouteFavCams(!routeFavCams)} />
              </div>

              <CameraList cameras={routeFavCams} getCheckedHighway={()=>{}} />
            </div>
          }
        </Container>
      }

      {authContext.loginStateKnown && !authContext.username &&
        <Container>
          <div className="login-prompt">
            <h3>Login required</h3>

            <p>
              You must be <a href="#" onClick={() => toggleAuthModal("Sign In")}>logged in</a> to view this page.
            </p>
          </div>
        </Container>
      }

      <Footer />
    </div>
  );
}
