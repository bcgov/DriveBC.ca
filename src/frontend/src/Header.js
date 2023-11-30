/* eslint-disable no-unused-vars */
// React
import React, { useState, useContext } from "react";

// Third party packages
import { LinkContainer } from 'react-router-bootstrap';
import { AuthContext } from "./App";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

// Static files
import logo from './images/dbc-logo.svg';

// Styling
import './Header.scss';


// Third party packages
import {useMediaQuery} from '@uidotdev/usehooks';


export default function Header() {
  // State hooks
  const [expanded, setExpanded] = useState(false);
  const { authContext, setAuthContext } = useContext(AuthContext);

  // Component functions
  const getNavLink = (title) => {
    return <Nav.Link active={false} onClick={() => setTimeout(() => setExpanded(false))}>{title}</Nav.Link>
  };

  const getExternalNavLink = (title) => {
    return <Nav.Link reloadDocument active={false} onClick={() => setTimeout(() => setExpanded(false))}>{title}</Nav.Link>
  };

  const toggleAuthModal = (action) => {
    setAuthContext((prior) => {
      if (!prior.showingModal) { return { ...prior, showingModal: true, action }; }
      return prior;
    })
  };

  const xLargeScreen = useMediaQuery('only screen and (min-width : 992px)');

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

          <Navbar.Brand href="#home" tabIndex={xLargeScreen ? "0": "-1"}>
            <img className="header-logo" src={logo} alt="Government of British Columbia" />
          </Navbar.Brand>

          <div className="nav-divider"></div>

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <LinkContainer to="/">
                {getNavLink('Map')}
              </LinkContainer>
              <LinkContainer to="/cameras">
                {getNavLink('Cameras')}
              </LinkContainer>
              <LinkContainer to="/events">
                {getNavLink('Delays')}
              </LinkContainer>
              <LinkContainer to="/advisories">
                {getNavLink('Advisories')}
              </LinkContainer>
              <LinkContainer to="/bulletins">
                {getNavLink('Bulletins')}
              </LinkContainer>
              { authContext.loginStateKnown
                ? ( authContext.username
                    ? <React.Fragment>
                        <LinkContainer to="/account">
                          { getNavLink('My Account') }
                        </LinkContainer>
                        <a className='nav-link'
                          onClick={() => toggleAuthModal('Sign Out')}
                        >Sign out</a>
                      </React.Fragment>
                    : <a className='nav-link'
                        onClick={() => toggleAuthModal('Sign In')}
                      >Sign in</a>
                  )
                : ''
              }
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}
