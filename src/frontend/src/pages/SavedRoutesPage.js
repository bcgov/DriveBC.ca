// React
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const { authContext } = useContext(AuthContext);

  const navigate = useNavigate();

  // Redux
  const { favRoutes } = useSelector(useCallback(memoize(state => ({
    favRoutes: state.user.favRoutes
  }))));

  // States
  const [routeLabel, setRouteLabel] = useState();
  const [routeFavCams, setRouteFavCams] = useState();

  // Effects
  // Redirect to login page if user is not logged in
  useEffect(() => {
    if (!authContext.loginStateKnown) {
      return;
    }

    if (!authContext.username) {
      navigate('/');
      return;
    }
  }, [authContext]);

  // Rendering
  return (
    <div className="saved-routes-page">
      <PageHeader
        title="My routes"
        description="Manage and view your saved routes here.">
      </PageHeader>

      <Container>
        {!(favRoutes && favRoutes.length) &&
          <div className="empty-routes-display">
            <h3>No saved routes</h3>

            <p>
            You don&apos;t have any saved routes yet. You can add a saved route by searching for a &apos;From&apos; and &apos;To&apos; location on the map and clicking the save route button &#40;<FontAwesomeIcon icon={faStarOutline} />&#41;.
            </p>
          </div>
        }

        {!routeFavCams &&
          <div className="route-list">
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
              <FontAwesomeIcon className="close-btn" icon={faXmark} onClick={() => setRouteFavCams(null)} />
            </div>

            <CameraList cameras={routeFavCams} getCheckedHighway={()=>{}} />
          </div>
        }
      </Container>

      <Footer />
    </div>
  );
}
