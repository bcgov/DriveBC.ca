// React
import React, { useCallback, useContext, useEffect } from 'react';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { pushFavCam, resetPendingAction } from '../../../slices/userSlice';

// External imports
import { DropdownButton } from 'react-bootstrap';
import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import {
  faCircleUser,
  faGear,
  faRoute,
  faStar,
  faVideoCamera
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMediaQuery } from '@uidotdev/usehooks';

// Internal imports
import { AuthContext } from "../../../App";
import { addFavoriteCamera } from '../../data/webcams';
import { getCookie } from "../../../util";
import { logoutDispatch } from "../../data/account";

// Styling
import './UserNavigation.scss';

export default function UserNavigation(props) {
  /* Setup */
  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);

  // Redux
  const dispatch = useDispatch();
  const { favCams, favRoutes, pendingAction, selectedRoute, searchedRoutes } = useSelector(useCallback(memoize(state => ({
    favCams: state.user.favCams,
    favRoutes: state.user.favRoutes,
    pendingAction: state.user.pendingAction,
    selectedRoute: state.routes.selectedRoute,
    searchedRoutes: state.routes.searchedRoutes,
  }))));

  // Effects
  useEffect(() => {
    // Handle actions pending login
    if (pendingAction && favCams) { // don't run when favCams haven't loaded
      if (pendingAction.action == 'pushFavCam') {
        addFavoriteCamera(pendingAction.payload, dispatch, pushFavCam);
        dispatch(resetPendingAction());
      }
    }
  }, [favCams]);

  /* Helpers */
  const toggleAuthModal = (action) => {
    // Hide screen reader content behind the lightbox
    const allFocuses = document.querySelectorAll("a, button, input");
    allFocuses.forEach((element) => {
      element.classList.add("hidden-by-modal");

      if (element.hasAttribute("tabindex") ) {

        if (element.getAttribute("tabindex") === "0") {
          element.classList.add("restore-tabindex");
        }

        if (element.getAttribute("tabindex") === "-1") {
          element.classList.add("already-hidden");
        }
      }

      element.setAttribute("aria-hidden", "true");
      element.setAttribute("tabindex", "-1");
    });

    const modalContent = document.getElementById("modal-content");
    if (modalContent) {
      modalContent.focus();
    }

    setAuthContext((prior) => {
      if (!prior.showingModal) {
        return { ...prior, showingModal: true, action };
      }
      return prior;
    })
  };

  /* Handlers */
  const handleSubmit = (e) => {
    logoutDispatch(dispatch, selectedRoute, searchedRoutes);
  };

  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  /* Components */
  const getUserMenu = () => {
    return (
      <DropdownButton
        variant="outline-primary"
        align="end"
        id="user-menu"
        title={<><FontAwesomeIcon icon={faCircleUser} /> <span className="sr-only">Account</span></>}>

        <div id="user-menu-header">
          <FontAwesomeIcon id="user-icon" icon={faCircleUser} />
          <p id="user-email">{authContext.email}</p>

          <form id="signout-link" className="nav-link" method='post' action={`${window.API_HOST}/accounts/logout/`} onSubmit={handleSubmit}>
            <input type='hidden' name='csrfmiddlewaretoken' value={getCookie('csrftoken')} />
            <button type='submit' autoFocus={true}>Sign out</button>
          </form>
        </div>

        <div className="menu-items">
          { !largeScreen &&
            <a className="menu-item" href="/my-cameras">
              <div className="menu-item-header">
                <FontAwesomeIcon icon={faVideoCamera} />
                My cameras
                <span className="item-count">{favCams ? favCams.length : 0}</span>
              </div>

              <FontAwesomeIcon icon={faChevronRight} />
            </a>
          }

          { !largeScreen &&
            <a className="menu-item" href="/my-routes">
              <div className="menu-item-header">
                <FontAwesomeIcon icon={faRoute} />
                My routes
                <span className="item-count">{favRoutes ? favRoutes.length : 0}</span>
              </div>

              <FontAwesomeIcon icon={faChevronRight} />
            </a>
          }

          <a className="menu-item" href="/account">
            <div className="menu-item-header">
              <FontAwesomeIcon icon={faGear} />
              Account settings
            </div>

            <FontAwesomeIcon icon={faChevronRight} />
          </a>

          <div className='release-tag'>
            { window.DEPLOYMENT_TAG || '' }
            { window.RELEASE ? ` (${window.RELEASE})` : '' }
          </div>
        </div>
      </DropdownButton>
    );
  }

  const getFavoritesMenu = () => {
    return (
      <DropdownButton
        variant="outline-primary"
        align="end"
        id="favorites-menu"
        title={<><FontAwesomeIcon icon={faStar} /> Favourites</>}>

        <div className="menu-items">
          <a href="/my-cameras" className="menu-item">
            <div className="menu-item-header">
              <FontAwesomeIcon icon={faVideoCamera} />
              My cameras
              <span className="item-count">{favCams ? favCams.length : 0}</span>
            </div>

            <FontAwesomeIcon icon={faChevronRight} />
          </a>

          <a href="/my-routes" className="menu-item">
            <div className="menu-item-header">
              <FontAwesomeIcon icon={faRoute} />
              My routes
              <span className="item-count">{favRoutes ? favRoutes.length : 0}</span>
            </div>

            <FontAwesomeIcon icon={faChevronRight} />
          </a>
        </div>
      </DropdownButton>
    );
  }

  const getSigninBtn = () => {
    return (
      <a
      className="btn btn-primary"
      id="signin-btn"
      alt="Sign in button"
      onClick={() => {
        toggleAuthModal('Sign in');
      }}
      onKeyDown={keyEvent => {
        if (keyEvent.key === 'Enter' || keyEvent.key === 'NumpadEnter') {
        keyEvent.preventDefault();
        toggleAuthModal('Sign in');
        }
      }}
      tabIndex={0}
      >
      Sign in
      </a>
    );
  }

  /* Main component */
  return authContext.loginStateKnown && (
    <div id="user-navigation">
      { authContext.username && largeScreen &&
        getFavoritesMenu()
      }

      { authContext.username &&
        getUserMenu()
      }

      { !authContext.username &&
        getSigninBtn()
      }
    </div>
  );
}
