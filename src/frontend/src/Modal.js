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
    // Reset focus and screen reader content
    const allHidden = document.querySelectorAll(".hidden-by-modal");
    allHidden.forEach((element) => {
      element.removeAttribute("aria-hidden");

      if (element.classList.contains("already-hidden")) {
        element.classList.remove("already-hidden");
      }

      else if (element.classList.contains("restore-tabindex")) {
        element.setAttribute("tabindex", "0");
        element.classList.remove("restore-tabindex");
      }

      else {
        element.removeAttribute("tabindex");
      }

      element.removeAttribute("aria-hidden");
      element.classList.remove("hidden-by-modal");
    });

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

  const whatIsBCeID = (
    "BCeID is a secure login service that allows you to access various government services online."
  );

  const tooltipBCeID = (
    <Tooltip id="tooltipID" className="tooltip-content">
      <p>{whatIsBCeID}</p>
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
        id="modal-content"
        className="content"
        onClick={(e) => { e.stopPropagation(); }}
        onKeyPress={(e) => { e.stopPropagation(); }}
        role="alertdialog"
        aria-modal="true"
      >

        <div className='header'>
          <button
            id="modal-closer"
            className="modal-closer close-panel"
            aria-label="close modal"
            onClick={resetAuthModal}
            onKeyPress={resetAuthModal}>
            <FontAwesomeIcon icon={faXmark} />
          </button>

          <div className='title'>{authContext.action}</div>

        </div>

        <div className='body'>
          { authContext.action === 'Sign In' &&
            <form method='post' action={`${window.API_HOST}/accounts/oidc/bceid/login/`}>
              <input type='hidden' name='csrfmiddlewaretoken' value={getCookie('csrftoken')} />
              <input type='hidden' name='next' value={window.location.href} />

              <p>Access your saved cameras and routes</p>

              <button type='submit' className="btn btn-outline-primary">Sign in with Basic BCeID</button>

              <div>
                Don&apos;t have a Basic BCeID Account?<br />
                <a href="https://www.bceid.ca/os/?10289&SkipTo=Basic">Click here to create one</a>
              </div>

              <div className="BCeID-definition">
                <span>What is a BCeID?</span>

                <OverlayTrigger placement="top" overlay={tooltipBCeID}>
                <button className="tooltip-info" aria-label={'What is a BCeID? ' + whatIsBCeID}>?</button>
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
