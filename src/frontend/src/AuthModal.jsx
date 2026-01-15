// React
import React, { useCallback, useContext, useEffect, useRef } from "react";

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { updatePendingAction } from './slices/userSlice';
import { logoutDispatch } from "./Components/data/account";

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
import './AuthModal.scss';

// Focus lock inside modal
function useFocusLock(isActive) {
  const containerRef = useRef(null);

  const getFocusableElements = () => {
    return containerRef.current?.querySelectorAll(
      'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
    ) || [];
  };

  const handleFocusStart = () => {
    const focusables = getFocusableElements();
    focusables[focusables.length - 1]?.focus();
  };

  const handleFocusEnd = () => {
    const focusables = getFocusableElements();
    focusables[0]?.focus();
  };

  // focus on mount
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    getFocusableElements()[0]?.focus();
  }, [isActive]);

  return { containerRef, handleFocusStart, handleFocusEnd };
}

export default function AuthModal() {
  /* Setup */
  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { containerRef, handleFocusStart, handleFocusEnd } = useFocusLock(authContext && authContext.showingModal);

  // Redux
  const dispatch = useDispatch();

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

  const whatIsBCeID = (
    "BCeID is a secure login service that allows you to access various government services online."
  );

  const tooltipBCeID = (
    <Tooltip id="tooltipID" className="tooltip-content">
      <p>{whatIsBCeID}</p>
    </Tooltip>
  );

  // Main component
  return authContext.showingModal && (
    <div
      className="shared-modal auth-modal"
      tabIndex={0}
      onClick={resetAuthModal}
      onKeyDown={resetAuthModal}>

      {/* Top sentinel for focus */}
      <div tabIndex={0} onFocus={handleFocusStart} />

      <div
        ref={containerRef}
        tabIndex={-1}
        id="modal-content"
        className={`content`}
        onClick={(e) => { e.stopPropagation(); }}
        onKeyDown={(e) => { e.stopPropagation(); }}
        role="alertdialog"
        aria-modal="true">

        <div className='header'>
          <div className='title'>{authContext.action}</div>
        </div>

        <div className='body'>
          {authContext.action === 'Sign in' &&
            <div className={'form-container'}>
              <p>Save cameras, routes, and setup notifications to be informed on delays that could affect your travel.</p>

              <form className={'otp-form'} method='post' action={`${window.API_HOST}/accounts/oidc/otp/login/`}>
                <input type='hidden' name='csrfmiddlewaretoken' value={getCookie('csrftoken')} />
                <input type='hidden' name='next' value={window.location.href} />

                <button type='submit' className="btn btn-primary" autoFocus={true}>Sign in with a one-time passcode</button>

                <p>Login with your email and we’ll send you a one-time passcode.</p>
              </form>

              <form className={'bceid-form'} method='post' action={`${window.API_HOST}/accounts/oidc/bceid/login/`}>
                <input type='hidden' name='csrfmiddlewaretoken' value={getCookie('csrftoken')} />
                <input type='hidden' name='next' value={window.location.href} />

                <button type='submit' className="btn btn-outline-primary" autoFocus={true}>Sign in with Basic BCeID</button>

                <p>BCeID is a secure login service to access government services online for all residents and visitors. Don&apos;t have a BCeID account? <a href={window.BCEID_REGISTER_URL}>Create one</a></p>
              </form>
            </div>
          }
        </div>

        <button
          id="modal-closer"
          className="modal-closer close-panel"
          aria-label="close modal"
          onClick={() => {
            resetAuthModal()
          }}
          onKeyDown={keyEvent => {
            if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
              resetAuthModal()
            }
          }}>
          <FontAwesomeIcon icon={faXmark}/>
        </button>

        <div className='release-tag'>
          { window.DEPLOYMENT_TAG || '' }
          { window.RELEASE ? ` (${window.RELEASE})` : '' }
        </div>
      </div>

      {/* Bottom sentinel for focus */}
      <div tabIndex={0} onFocus={handleFocusEnd} />
    </div>
  )
}
