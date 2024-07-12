// React
import React, {useContext } from "react";

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

// Styling
import './UserNavigation.scss';

export default function UserNavigation(props) {
  /* Setup */
  const { authContext, setAuthContext } = useContext(AuthContext);

  /* Helpers */
  const toggleAuthModal = (action) => {
    setAuthContext((prior) => {
      if (!prior.showingModal) {
        return { ...prior, showingModal: true, action };
      }
      return prior;
    })
  };

  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  /* Components */
  const getUserMenu = () => {
    return (
      <DropdownButton
        align="end"
        id="user-menu"
        title={<FontAwesomeIcon icon={faCircleUser} />}>

        <div id="user-menu-header">
          <FontAwesomeIcon id="user-icon" icon={faCircleUser} />
          <p id="user-email">{authContext.email}</p>
          <a id="signout-link" className="nav-link" alt="Sign Out"
            onClick={() => toggleAuthModal('Sign Out')}>
            Sign out
          </a>
        </div>

        <div className="menu-items">
          { !largeScreen &&
            <a className="menu-item" href="/my-cameras">
              <div className="menu-item-header">
                <FontAwesomeIcon icon={faVideoCamera} />
                My cameras
              </div>

              <FontAwesomeIcon icon={faChevronRight} />
            </a>
          }

          { !largeScreen &&
            <a className="menu-item" href="/my-cameras">
              <div className="menu-item-header">
                <FontAwesomeIcon icon={faRoute} />
                My routes
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
        </div>
      </DropdownButton>
    );
  }

  const getFavoritesMenu = () => {
    return (
      <DropdownButton
        align="end"
        id="favorites-menu"
        title={<><FontAwesomeIcon icon={faStar} /> Favorites</>}>

        <div className="menu-items">
          <a href="/my-cameras" className="menu-item">
            <div className="menu-item-header">
              <FontAwesomeIcon icon={faVideoCamera} />
              My cameras
              <span className="item-count">{sessionStorage.getItem('myWebcamNum')}</span>
            </div>

            <FontAwesomeIcon icon={faChevronRight} />
          </a>

          <a href="/my-cameras" className="menu-item">
            <div className="menu-item-header">
              <FontAwesomeIcon icon={faRoute} />
              My routes
              <span className="item-count">0</span>
            </div>

            <FontAwesomeIcon icon={faChevronRight} />
          </a>
        </div>
      </DropdownButton>
    );
  }

  const getSigninBtn = () => {
    return (
      <a className="btn btn-primary" id="signin-btn" alt="Sign in button"
        onClick={() => {toggleAuthModal('Sign In')}}>
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
