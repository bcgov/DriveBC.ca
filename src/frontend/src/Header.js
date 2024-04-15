// React
import React, { useState } from "react";

// Third party packages
import {LinkContainer} from 'react-router-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

// Static files
import logo from './images/dbc-logo-beta.svg';

// Styling
import './Header.scss';


// Third party packages
import {useMediaQuery} from '@uidotdev/usehooks';

export default function Header() {
  // State hooks
  const [expanded, setExpanded] = useState(false);

  // Component functions
  const getNavLink = (title) => {
    return <Nav.Link active={false} onClick={() => setTimeout(() => setExpanded(false))}>{title}</Nav.Link>
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

          <Navbar.Brand href="/" tabIndex={xLargeScreen ? "0": "-1"}>
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
        </Container>
      </Navbar>
    </header>
  );
}
