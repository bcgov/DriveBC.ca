// React
import React, { useCallback, useContext } from "react";

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { resetFavLists, updatePendingAction } from './slices/userSlice';
import { updateSelectedRoute } from './slices/routesSlice'

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

// Internal imports
import { AuthContext } from "./App";
import { getCookie } from "./util";

// Styling
import './Modal.scss';

export default function Modal() {
  /* Setup */
  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);

  // Redux
  const dispatch = useDispatch();
  const { selectedRoute } = useSelector(useCallback(memoize(state => ({
    selectedRoute: state.routes.selectedRoute
  }))));

  /* Handlers */
  const handleSubmit = (e) => {
    dispatch(resetFavLists());
    if (selectedRoute && selectedRoute.id) {
      const payload = {...selectedRoute, id: null, saved: false, label: null};
      dispatch(updateSelectedRoute(payload));
    }
  };

  const resetAuthModal = () => {
    setAuthContext((prior) => {
      return { ...prior, showingModal: !prior.showingModal, action: null }
    });

    // Reset pending action if modal is closed
    dispatch(updatePendingAction({
      action: null,
      payload: null,
    }));
  };

  /* Rendering */
  // Subcomponents
  if (!authContext.showingModal) {
    return <div />;
  }

  const tooltipBCeID = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>BCeID is a secure login service that allows you to access various government services online.</p>
    </Tooltip>
  );

  // Main component
  return (
    <div
      className="auth-modal"
      tabIndex={0}
      onClick={resetAuthModal}
      onKeyPress={resetAuthModal}
    >

      <div
        tabIndex={0}
        className="content"
        onClick={(e) => { e.stopPropagation(); }}
        onKeyPress={(e) => { e.stopPropagation(); }}
      >

        <div className='header'>
          <FontAwesomeIcon
            id="modal-closer"
            className="modal-closer"
            icon={faXmark}
            onClick={resetAuthModal} />

          <div className='title'>{authContext.action}</div>
        </div>

        <div className='body'>
          { authContext.action === 'Sign In' &&
            <form method='post' action={`${window.API_HOST}/accounts/oidc/bceid/login/`}>
              <input type='hidden' name='csrfmiddlewaretoken' value={getCookie('csrftoken')} />
              <input type='hidden' name='next' value={window.location.href} />

              <p>Access your saved cameras and routes</p>

              <button type='submit' className="btn btn-outline-primary">Sign in with BCeID</button>

              <div className="BCeID-definition">
                <span>What is a BCeID?</span>

                <OverlayTrigger placement="top" overlay={tooltipBCeID}>
                  <span className="tooltip-info">?</span>
                </OverlayTrigger>
              </div>
            </form>
          }

          { authContext.action === 'Sign Out' &&
            <form method='post' action={`${window.API_HOST}/accounts/logout/`} onSubmit={handleSubmit}>
              <input type='hidden' name='csrfmiddlewaretoken' value={getCookie('csrftoken')} />
              <input type='hidden' name='next' value={window.location.href} />
              <button type='submit' className="btn btn-outline-primary">Sign out of DriveBC</button>
            </form>
          }
        </div>
      </div>
    </div>
  )
}
