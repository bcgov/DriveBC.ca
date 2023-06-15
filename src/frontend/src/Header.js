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
						<span class="line line1"></span>
						<span class="line line2"></span>
						<span class="line line3"></span>
					</Navbar.Toggle>
					<Navbar.Brand href="#home">
						<a href="https://gov.bc.ca" className="header-link">
							<img className="header-logo" src={logo} alt="Government of British Columbia" />
						</a>
					</Navbar.Brand>
					<div className="divider"></div>
					<Navbar.Collapse id="basic-navbar-nav">
					<Nav className="me-auto">
						<LinkContainer to="/">
						<Nav.Link>Home</Nav.Link>
						</LinkContainer>
						<LinkContainer to="/StylesPage">
							<Nav.Link>Styleguide</Nav.Link>
						</LinkContainer>
						<LinkContainer to="/CamerasPage">
							<Nav.Link>Cameras</Nav.Link>
						</LinkContainer>
					</Nav>
					</Navbar.Collapse>
				</Container>
			</Navbar>
		</header>
	)
}