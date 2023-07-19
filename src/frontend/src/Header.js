import "./Header.scss";
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import logo from './images/BCID_H_rgb_pos.png';
import Container from 'react-bootstrap/Container';
import { LinkContainer } from "react-router-bootstrap";


export default function Header() {
	return (
		<header className="header--shown">
			<Navbar expand="lg">
				<Container>
					<Navbar.Toggle>
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
						<LinkContainer to="/">
						<Nav.Link>Map</Nav.Link>
						</LinkContainer>
						<LinkContainer to="/cameras-page">
							<Nav.Link>Cameras</Nav.Link>
						</LinkContainer>
						<LinkContainer to="/events-page">
							<Nav.Link>Events</Nav.Link>
						</LinkContainer>
					</Nav>
					</Navbar.Collapse>
				</Container>
			</Navbar>
		</header>
	)
}
