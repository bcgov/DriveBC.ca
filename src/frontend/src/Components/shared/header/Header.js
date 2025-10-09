// React
import React, { useCallback, useContext, useEffect, useState } from "react";

// Navigation
import { Link, useLocation, useSearchParams } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories, updateBulletins } from '../../../slices/cmsSlice';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCommentExclamation, faGlobePointer } from '@fortawesome/pro-regular-svg-icons';
import { LinkContainer } from 'react-router-bootstrap';
import { useMediaQuery } from '@uidotdev/usehooks';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

// Internal imports
import { CMSContext } from '../../../App';
import { filterAdvisoryByRoute } from "../../map/helpers";
import { getAdvisories } from '../../data/advisories.js';
import { getBulletins } from '../../data/bulletins.js';
import UserNavigation from "./UserNavigation";
import RouteSearch from '../../routing/RouteSearch';

// Static files
import logo from '../../..//images/dbc-header-logo.svg';

// Styling
import './Header.scss';

export default function Header() {
  /* Setup */
  // Misc
  const xLargeScreen = useMediaQuery('only screen and (min-width : 1200px)');
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  // Check current page location
  const location = useLocation();
  const showSearch = ['/cameras', '/delays'].some(path => location.pathname.startsWith(path)) || location.pathname === '/';

  // Redux
  const dispatch = useDispatch();
  const { advisories, filteredAdvisories, bulletins,
    routes: { searchLocationFrom, searchLocationTo, selectedRoute, showRouteObjs }
  } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    filteredAdvisories: state.cms.advisories.filteredList,
    bulletins: state.cms.bulletins.list,
    routes: state.routes
  }))));

  // Routing
  const [searchParams, _setSearchParams] = useSearchParams();

  // Context
  const { cmsContext } = useContext(CMSContext);

  // States
  const [advisoriesCount, setAdvisoriesCount] = useState();
  const [bulletinsCount, setBulletinsCount] = useState();
  const [expanded, setExpanded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [openSearch, setOpenSearch] = useState(searchParams.get('start') || searchParams.get('end'));
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(true);

  // Effects
  const loadAdvisories = async () => {
    // Skip loading if the advisories are already loaded on launch
    if (advisories) {
      setAdvisoriesCount(getUnreadAdvisoriesCount(filteredAdvisories));
      return;
    }

    const advisoriesData = await getAdvisories();
    const filteredAdvisoriesData = selectedRoute ? filterAdvisoryByRoute(advisoriesData, selectedRoute) : advisoriesData;
    dispatch(updateAdvisories({
      list: advisoriesData,
      filteredList: filteredAdvisoriesData,
      timeStamp: new Date().getTime()
    }));

    setAdvisoriesCount(getUnreadAdvisoriesCount(filteredAdvisoriesData));
  }

  const loadBulletins = async () => {
    let bulletinsData = bulletins;

    if (!bulletinsData) {
      bulletinsData = await getBulletins();

      dispatch(updateBulletins({
        list: bulletinsData,
        timeStamp: new Date().getTime()
      }));
    }

    setBulletinsCount(getUnreadBulletinsCount(bulletinsData));
  }

  useEffect(() => {
    loadAdvisories();
    loadBulletins();
  }, [cmsContext]);

  useEffect(() => {
    if (searchLocationFrom.length && searchLocationTo.length) {
      setOpenSearch(false);
    }
  }, [selectedRoute]);

  /* Helpers */
  const getUnreadAdvisoriesCount = (advisoriesData) => {
    if (!advisoriesData) {
      return 0;
    }

    const readAdvisories = advisoriesData.filter(advisory => cmsContext.readAdvisories.includes(
      advisory.id.toString() + '-' + advisory.live_revision.toString()
    ));
    return advisoriesData.length - readAdvisories.length;
  }

  const getUnreadBulletinsCount = (bulletinsData) => {
    const readBulletins = bulletinsData.filter(bulletin => cmsContext.readBulletins.includes(
      bulletin.id.toString() + '-' + bulletin.live_revision.toString()
    ));
    return bulletinsData.length - readBulletins.length;
  }

  /* Handlers */
  const onClickActions = () => {
    setTimeout(() => setExpanded(false));
    sessionStorage.setItem('scrollPosition', 0);
  }

  /* Rendering */
  // Sub components
  const getNavLink = (title, count) => {
    return (
      <Nav.Link active={false} onClick={onClickActions}>
        <div className='title'>{title} {!!count && <div className="unread-count">{count}</div>}</div>

        {!xLargeScreen &&
          <FontAwesomeIcon icon={faChevronRight} />
        }
      </Nav.Link>
    );
  };

  const getLegacyLink = () => {
    return (window.LEGACY_URL && window.LEGACY_URL !== 'undefined') ? window.LEGACY_URL : 'https://drivebc.ca';
  }

  const legacyDBCHandler = () => {
    window.open(
      getLegacyLink(),
      "_self"
    );
  }

  // Main component
  return (
    <header>
      <Navbar
        expand="xl"
        expanded={expanded}
        onToggle={(visible) => setIsNavbarCollapsed(!visible)}
        onSelect={() => setIsNavbarCollapsed(true)}>

        <Container>
          <div className='header'>
            <div className='header-left'>
              <Navbar.Toggle onClick={() => setExpanded(expanded ? false : "expanded")}>
                <span className="line line1"></span>
                <span className="line line2"></span>
                <span className="line line3"></span>
              </Navbar.Toggle>

              <Navbar.Brand href="/" tabIndex={xLargeScreen ? "0": "-1"}>
                <img className="header-logo" src={logo} alt="Government of British Columbia" />
              </Navbar.Brand>

              <div className="nav-divider"></div>

              {!xLargeScreen &&
                <UserNavigation />
              }
            </div>

            {smallScreen && showSearch && !selectedRoute &&
              <button
                className="search-trigger btn"
                aria-label="search location"
                onClick={() => setOpenSearch(true)}>
                Search location
              </button>
            }

            {smallScreen && showSearch && !openSearch && selectedRoute && isNavbarCollapsed && !showRouteObjs &&
              <button
                className={`searched-route btn show`}
                aria-label="searched route"
                onClick={() => setOpenSearch(true)}>
                <div className="searched-route__start">
                  <div className="searched-route__icon">
                    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <mask id="path-1-inside-1_19431_161254" fill="white">
                      <path d="M7 12.5C4.84375 12.5 2.875 11.375 1.79688 9.5C0.71875 7.64844 0.71875 5.375 1.79688 3.5C2.875 1.64844 4.84375 0.5 7 0.5C9.13281 0.5 11.1016 1.64844 12.1797 3.5C13.2578 5.375 13.2578 7.64844 12.1797 9.5C11.1016 11.375 9.13281 12.5 7 12.5Z"/>
                      </mask>
                      <path d="M1.79688 9.5L4.39759 8.00459L4.39352 7.9975L4.3894 7.99043L1.79688 9.5ZM1.79688 3.5L-0.795651 1.99043L-0.799767 1.9975L-0.803844 2.00459L1.79688 3.5ZM12.1797 3.5L14.7804 2.00459L14.7763 1.9975L14.7722 1.99043L12.1797 3.5ZM12.1797 9.5L9.58716 7.99043L9.58305 7.9975L9.57897 8.00459L12.1797 9.5ZM7 9.5C5.90575 9.5 4.93472 8.93871 4.39759 8.00459L-0.803844 10.9954C0.815285 13.8113 3.78175 15.5 7 15.5V9.5ZM4.3894 7.99043C3.85796 7.07773 3.84846 5.95043 4.39759 4.99541L-0.803844 2.00459C-2.41096 4.79957 -2.42046 8.21914 -0.795651 11.0096L4.3894 7.99043ZM4.3894 5.00957C4.93637 4.07021 5.92381 3.5 7 3.5V-2.5C3.76369 -2.5 0.813626 -0.773331 -0.795651 1.99043L4.3894 5.00957ZM7 3.5C8.04624 3.5 9.03687 4.06451 9.58716 5.00957L14.7722 1.99043C13.1663 -0.767637 10.2194 -2.5 7 -2.5V3.5ZM9.57897 4.99541C10.1281 5.95043 10.1186 7.07773 9.58716 7.99043L14.7722 11.0096C16.397 8.21914 16.3875 4.79957 14.7804 2.00459L9.57897 4.99541ZM9.57897 8.00459C9.0386 8.94436 8.06425 9.5 7 9.5V15.5C10.2014 15.5 13.1645 13.8056 14.7804 10.9954L9.57897 8.00459Z" fill="#464341" mask="url(#path-1-inside-1_19431_161254)"/>
                    </svg>
                  </div>
                  {searchLocationFrom[0].label}
                </div>
                <div className="searched-route__end">
                  <div className="searched-route__icon">
                    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <mask id="path-1-outside-1_19431_161262" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="20" fill="black">
                      <rect fill="white" width="16" height="20"/>
                      <path d="M8.71875 17.625C8.34375 18.0938 7.625 18.0938 7.25 17.625C5.65625 15.5938 2 10.75 2 8C2 4.6875 4.6875 2 8 2C11.3125 2 14 4.6875 14 8C14 10.75 10.3438 15.5938 8.71875 17.625ZM8 6C7.28125 6 6.625 6.40625 6.25 7C5.90625 7.625 5.90625 8.40625 6.25 9C6.625 9.625 7.28125 10 8 10C8.6875 10 9.34375 9.625 9.71875 9C10.0625 8.40625 10.0625 7.625 9.71875 7C9.34375 6.40625 8.6875 6 8 6Z"/>
                      </mask>
                      <path d="M8.71875 17.625C8.34375 18.0938 7.625 18.0938 7.25 17.625C5.65625 15.5938 2 10.75 2 8C2 4.6875 4.6875 2 8 2C11.3125 2 14 4.6875 14 8C14 10.75 10.3438 15.5938 8.71875 17.625ZM8 6C7.28125 6 6.625 6.40625 6.25 7C5.90625 7.625 5.90625 8.40625 6.25 9C6.625 9.625 7.28125 10 8 10C8.6875 10 9.34375 9.625 9.71875 9C10.0625 8.40625 10.0625 7.625 9.71875 7C9.34375 6.40625 8.6875 6 8 6Z" fill="#D8292F"/>
                      <path d="M7.25 17.625L6.29759 18.3723L6.30474 18.3812L7.25 17.625ZM6.25 7L5.22651 6.35359L5.20696 6.38454L5.18932 6.41662L6.25 7ZM6.25 9L5.20238 9.60652L5.20712 9.6147L5.21198 9.62281L6.25 9ZM9.71875 9L10.7568 9.62281L10.7616 9.6147L10.7664 9.60652L9.71875 9ZM9.71875 7L10.7794 6.41662L10.7618 6.38454L10.7422 6.35359L9.71875 7ZM7.77349 16.8688C7.88309 16.7318 8.08566 16.7318 8.19526 16.8688L6.30474 18.3812C7.16434 19.4557 8.80441 19.4557 9.66401 18.3812L7.77349 16.8688ZM8.20237 16.8778C7.41258 15.8712 6.13448 14.1959 5.05822 12.4475C4.51993 11.573 4.04689 10.7038 3.71173 9.90836C3.36837 9.09351 3.21053 8.45016 3.21053 8H0.789474C0.789474 8.92484 1.08867 9.91821 1.48066 10.8485C1.88085 11.7982 2.42148 12.7825 2.99647 13.7166C4.14677 15.5853 5.49367 17.3476 6.29763 18.3722L8.20237 16.8778ZM3.21053 8C3.21053 5.35606 5.35606 3.21053 8 3.21053V0.789474C4.01894 0.789474 0.789474 4.01894 0.789474 8H3.21053ZM8 3.21053C10.6439 3.21053 12.7895 5.35606 12.7895 8H15.2105C15.2105 4.01894 11.9811 0.789474 8 0.789474V3.21053ZM12.7895 8C12.7895 8.45007 12.6317 9.09333 12.288 9.90783C11.9525 10.7029 11.4787 11.5719 10.9389 12.4459C9.85952 14.1932 8.57425 15.8678 7.77349 16.8688L9.66401 18.3812C10.4882 17.3509 11.8436 15.5881 12.9986 13.7182C13.5759 12.7836 14.1178 11.799 14.5186 10.849C14.9113 9.91839 15.2105 8.92493 15.2105 8H12.7895ZM8 4.78947C6.82063 4.78947 5.798 5.44873 5.22651 6.35359L7.27349 7.64641C7.452 7.36377 7.74187 7.21053 8 7.21053V4.78947ZM5.18932 6.41662C4.65112 7.39517 4.63608 8.62837 5.20238 9.60652L7.29762 8.39348C7.17642 8.18413 7.16138 7.85483 7.31068 7.58338L5.18932 6.41662ZM5.21198 9.62281C5.80196 10.6061 6.84872 11.2105 8 11.2105V8.78947C7.71378 8.78947 7.44804 8.64389 7.28802 8.37719L5.21198 9.62281ZM8 11.2105C9.13038 11.2105 10.1722 10.597 10.7568 9.62281L8.68073 8.37719C8.51526 8.65298 8.24462 8.78947 8 8.78947V11.2105ZM10.7664 9.60652C11.3327 8.62837 11.3176 7.39517 10.7794 6.41662L8.65807 7.58338C8.80737 7.85483 8.79233 8.18413 8.67113 8.39348L10.7664 9.60652ZM10.7422 6.35359C10.1767 5.45808 9.15811 4.78947 8 4.78947V7.21053C8.21689 7.21053 8.51085 7.35442 8.69526 7.64641L10.7422 6.35359Z" fill="white" mask="url(#path-1-outside-1_19431_161262)"/>
                    </svg>
                  </div>
                  {searchLocationTo[0].label}
                </div>
              </button>
            }
          </div>

          {smallScreen && showSearch && openSearch &&
            <div className={'location-search' + (openSearch ? ' visible' : '') + (selectedRoute ? ' selected-route' : '')}>
              <button
                className="close-search btn"
                aria-label="close search"
                onClick={() => setOpenSearch(false)}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              <RouteSearch showSpinner={showSpinner} onShowSpinnerChange={setShowSpinner}/>
            </div>
          }

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <LinkContainer to="/">
                {getNavLink('Map')}
              </LinkContainer>

              <LinkContainer to="/cameras">
                {getNavLink('Cameras')}
              </LinkContainer>

              <LinkContainer to="/delays">
                {getNavLink('Delays')}
              </LinkContainer>

              <LinkContainer to="/advisories">
                {getNavLink('Advisories', advisoriesCount)}
              </LinkContainer>

              <LinkContainer to="/bulletins">
                {getNavLink('Bulletins', bulletinsCount)}
              </LinkContainer>

              {!xLargeScreen &&
                <LinkContainer to="/problems">
                  {getNavLink('Report a problem')}
                </LinkContainer>
              }

              {!xLargeScreen &&
                <div className='filler' />
              }
            </Nav>
          </Navbar.Collapse>

          {xLargeScreen &&
            <div className='header-right'>
              <Link to="/problems" className="btn btn-outline-primary header-right__btn" id="report-problem-btn" alt="Report a problem">
                <FontAwesomeIcon icon={faCommentExclamation}/>
                Report a problem
              </Link>

              <div className="nav-divider"/>

              <UserNavigation />
            </div>
          }
        </Container>
      </Navbar>
    </header>
  );
}
