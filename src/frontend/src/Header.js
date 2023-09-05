// React
import React, { useState } from "react";

// Third party packages
import {LinkContainer} from 'react-router-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

// Static files
import logo from './images/BCID_H_rgb_pos.png';

// Styling
import './Header.scss';

export default function Header() {
  // State hooks
  const [expanded, setExpanded] = useState(false);

  // Component functions
  const getNavLink = (title) => {
    return <Nav.Link active={false} onClick={() => setTimeout(() => setExpanded(false))}>{title}</Nav.Link>
  };

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

          <Navbar.Brand href="#home">
            <a href="https://gov.bc.ca" className="header-link">
              <img className="header-logo" src={logo} alt="Government of British Columbia" />
            </a>
          </Navbar.Brand>

          <div className="nav-divider"></div>

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <LinkContainer exact to="/">
                {getNavLink('Map')}
              </LinkContainer>
              <LinkContainer exact to="/cameras-page">
                {getNavLink('Cameras')}
              </LinkContainer>
              <LinkContainer exact to="/events-page">
                {getNavLink('Delays')}
              </LinkContainer>
              <LinkContainer exact to="/bulletins-page">
                {getNavLink('Bulletins')}
              </LinkContainer>
              <LinkContainer exact to="/advisories-page">
                {getNavLink('Advisories')}
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}
