// React
import React, { useCallback, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// Internal imports
import { AuthContext } from '../App';
import RouteDetails from '../Components/routing/RouteDetails';

import Footer from '../Footer';
import PageHeader from '../PageHeader';

// Styling
import './SavedRoutesPage.scss';

export default function SavedRoutesPage() {
  document.title = 'DriveBC - My Routes';

  const { authContext } = useContext(AuthContext);

  const navigate = useNavigate();

  // Redux
  const { favRoutes } = useSelector(useCallback(memoize(state => ({
    favRoutes: state.user.favRoutes
  }))));

  // useEffect hooks
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

      <div className="route-list">
        {favRoutes && favRoutes.length > 0 &&
          favRoutes.map(route => (
            <div key={route.id} className='route-card'>
              <RouteDetails route={route} />
            </div>
          ))
        }
      </div>

      <Footer />
    </div>
  );
}
