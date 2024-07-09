// React
import React, { useState, useContext } from "react";
import { Link } from 'react-router-dom';

// Third party packages
import { faComment,
         faStar,
         faUser,
         faVideoCamera,
         faRoute,
 } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LinkContainer } from 'react-router-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Dropdown, DropdownButton } from 'react-bootstrap';

import { AuthContext } from "./App";

// Static files
import logo from './images/dbc-logo-beta.svg';

// Styling
import './Header.scss';


// Third party packages
import {useMediaQuery} from '@uidotdev/usehooks';

export default function Header() {
  // State hooks
  const [expanded, setExpanded] = useState(false);
  const { authContext, setAuthContext } = useContext(AuthContext);

  // Component functions
  const onClickActions = () => {
    setTimeout(() => setExpanded(false));
    sessionStorage.setItem('scrollPosition', 0);
  }

  const toggleAuthModal = (action) => {
    setAuthContext((prior) => {
      if (!prior.showingModal) {
        return { ...prior, showingModal: true, action };
      }
      return prior;
    })
  };

  const getNavLink = (title) => {
    return <Nav.Link active={false} onClick={onClickActions}>{title}</Nav.Link>
  };

  const xLargeScreen = useMediaQuery('only screen and (min-width : 992px)');

  const surveyLink = `${window.SURVEY_LINK}` ||
    'https://forms.office.com/Pages/ResponsePage.aspx?id=AFLbbw09ikqwNtNoXjWa3G-k6A-ZOZVMlxBJti4jf_VURjI4MlRKMlRYQTVFUFJZOU5XTVVZUjEwQS4u';

  // Rendering
  return (
    <header className="header--shown">
      <Navbar expand="lg" expanded={expanded}>
        <Container>
          <Navbar.Toggle onClick={() => setExpanded(expanded ? false : "expanded")}>
            <span className="line line1"></span>
            <span className="line line2"></span>
            <span className="line line3"></span>
          </Navbar.Toggle>

          <Navbar.Brand href="/" tabIndex={xLargeScreen ? "0": "-1"}>
            <img className="header-logo" src={logo} alt="Government of British Columbia" />
          </Navbar.Brand>

          <div className="nav-divider"></div>

          { authContext.loginStateKnown
            ? ( authContext.username
                ? <React.Fragment>
                    <LinkContainer to="/account">
                      { getNavLink('My Account') }
                    </LinkContainer>
                    <a className="nav-link btn btn-outline-primary" id="signout-btn" alt="Sign out button"
                      onClick={() => toggleAuthModal('Sign Out')}
                    ><FontAwesomeIcon icon={faUser} />Sign out</a>
                  </React.Fragment>
                : <a className="nav-link btn btn-outline-primary" id="signin-btn" alt="Sign in button"
                    onClick={() => {toggleAuthModal('Sign In')}}
                  ><FontAwesomeIcon icon={faUser} />Sign in</a>
              )
            : ''
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
                {getNavLink('Advisories')}
              </LinkContainer>
              <LinkContainer to="/bulletins">
                {getNavLink('Bulletins')}
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>

          {xLargeScreen &&
            <a href={surveyLink} className="btn btn-primary" id="feedback-btn" target="_blank" rel="noreferrer" alt="Feedback survey"><FontAwesomeIcon icon={faComment} />Give Feedback</a>
          }

          { authContext.loginStateKnown
            ? ( authContext.username
                ?<DropdownButton
                    id="dropdown-favorites-btn"
                    title={<><FontAwesomeIcon icon={faStar} /> Favorites</>}
                    className="btn btn-primary"
                  >
                    <Dropdown.Item eventKey="my-cameras" as={Link} to="/my-cameras">
                      <FontAwesomeIcon icon={faVideoCamera} /> My cameras
                      <span className="camera-count-circle">{sessionStorage.getItem('myWebcamNum')}</span>
                    </Dropdown.Item>
                    <Dropdown.Item eventKey="routes">
                      <FontAwesomeIcon icon={faRoute} /> My routes
                    </Dropdown.Item>

                  </DropdownButton>
                : ''
              )
            : ''
          }
          </Container>
      </Navbar>
    </header>
  );
}
