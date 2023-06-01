import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Pagination from 'react-bootstrap/Pagination';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Fade from 'react-bootstrap/Fade';
import Collapse from 'react-bootstrap/Collapse';
import { useState } from 'react';
import Footer from '../Footer.js';

export default function StylesPage() {
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);

  return (
    <div className="styles-page">
      <Container>
        <h1 className="page-title">React-Bootstrap demo page</h1>
        <p>This is a demo page gathering a few Bootstrap components that could be used in the DBC project, while learning how to use the ReactBootstrap library and discover other related ones. Styling has been applied to certain parts of this page as well as some Bootstrap UI elements to match the BC sites' look and feel, using the DevHub.</p>
        <ul>
          <li>
            version used: React-Bootstrap v2.7.2 / Bootstrap 5.2
          </li>
          <li>
            used React-bootstrap, React-router-dom, React-router-bootstrap
          </li>
          <li>
            showcases typography, buttons, form elements, cards. alerts and transitions
          </li>
          <li>
            trying out react-awesome-reveal (similar to Animate.css), react-spring
          </li>
          <li>
            still needs to be updated with the design system from GDX (still in progress)
          </li>
        </ul>
      </Container>
      <Container>
        <div className="demo-group demo-group--typography">
          <h2 className="page-title">Typography</h2>
          <div>
            <h4>BC Sans</h4>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
          </div>
          <div>
            <h4>BC Sans italic</h4>
            <i>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</i>
          </div>
          <div>
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <h4>Heading 4</h4>
          </div>
			  </div>
      </Container>
      <Container>
        <div className="demo-group demo-group--button">
          <h2 className="page-title">Buttons</h2>
          <div>
            <Button variant="primary">Primary blue button</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
          </div>
          <div>
            <Button variant="outline-primary">Primary outlined button</Button>
          </div>
          <div className="demo-group--button__dark">
            <Button variant="outline-primary">Primary outlined button</Button>
          </div>
        </div>
      </Container>
      <Container>
        <div className="demo-group demo-group--form">
          <h1 className="page-title">Form</h1>
          <div>
            <Form>
              <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                <Form.Label>Email address</Form.Label>
                <Form.Control type="email" placeholder="name@example.com" />
              </Form.Group>
              <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                <Form.Label>Example textarea</Form.Label>
                <Form.Control as="textarea" rows={3} />
              </Form.Group>
            </Form>
          </div>

          <div>
            <Form>
              {['checkbox'].map((type) => (
                <div key={`inline-${type}`} className="mb-3">
                  <Form.Check
                    inline
                    label="1"
                    name="group1"
                    type={type}
                    id={`inline-${type}-1`}
                  />
                  <Form.Check
                    inline
                    label="2"
                    name="group1"
                    type={type}
                    id={`inline-${type}-2`}
                  />
                  <Form.Check
                    inline
                    disabled
                    label="3 (disabled)"
                    type={type}
                    id={`inline-${type}-3`}
                  />
                </div>
              ))}
            </Form>
          </div>

          <div>
          <Form>
              {['radio'].map((type) => (
                <div key={`inline-${type}`} className="mb-3">
                  <Form.Check
                    inline
                    label="1"
                    name="group1"
                    type={type}
                    id={`inline-${type}-1`}
                  />
                  <Form.Check
                    inline
                    label="2"
                    name="group1"
                    type={type}
                    id={`inline-${type}-2`}
                  />
                  <Form.Check
                    inline
                    disabled
                    label="3 (disabled)"
                    type={type}
                    id={`inline-${type}-3`}
                  />
                </div>
              ))}
            </Form>
          </div>
          <div>
            <Pagination>
            <Pagination.First />
            <Pagination.Prev />
            <Pagination.Item>{1}</Pagination.Item>
            <Pagination.Ellipsis />

            <Pagination.Item>{10}</Pagination.Item>
            <Pagination.Item>{11}</Pagination.Item>
            <Pagination.Item active>{12}</Pagination.Item>
            <Pagination.Item>{13}</Pagination.Item>
            <Pagination.Item disabled>{14}</Pagination.Item>

            <Pagination.Ellipsis />
            <Pagination.Item>{20}</Pagination.Item>
            <Pagination.Next />
            <Pagination.Last />
          </Pagination>
          </div>
        </div>
      </Container>
      <Container>
        <div className="demo-group demo-group--card">
          <h1 className="page-title">Cards</h1>
          <div className="cards">
            <Card style={{ width: '18rem' }}>
              <Card.Img variant="top" src="https://placehold.co/100x80" />
              <Card.Body>
                <Card.Title>Card Title</Card.Title>
                <Card.Text>
                  Some quick example text to build on the card title and make up the
                  bulk of the card's content.
                </Card.Text>
                <Button variant="primary">A button</Button>
              </Card.Body>
            </Card>
            <Card style={{ width: '18rem' }}>
              <Card.Img variant="top" src="https://placehold.co/100x80" />
              <Card.Body>
                <Card.Title>Card Title</Card.Title>
                <Card.Text>
                  Some quick example text to build on the card title and make up the
                  bulk of the card's content.
                </Card.Text>
                <Button variant="primary">A button</Button>
              </Card.Body>
            </Card>
            <Card style={{ width: '18rem' }}>
              <Card.Img variant="top" src="https://placehold.co/100x80" />
              <Card.Body>
                <Card.Title>Card Title</Card.Title>
                <Card.Text>
                  Some quick example text to build on the card title and make up the
                  bulk of the card's content.
                </Card.Text>
                <Button variant="primary">A button</Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
      <Container>
        <div className="demo-group demo-group--alert">
          <div>
            <h1 className="page-title">Alerts</h1>
            <Alert variant="success">
              <Alert.Heading>This is a success alert</Alert.Heading>
              <p>
                Please read this important alert message. This is an example of a success variant of a bootstrap alert.
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <hr />
              <p className="mb-0">
                Lorem lorem ipsum ipsum.
              </p>
            </Alert>
          </div>
        </div>
      </Container>
      <Container>
        <div className="demo-group demo-group--transitions">
          <h1 className="page-title">Transitions</h1>

          <div>
            <Button
              onClick={() => setOpen1(!open1)}
              aria-controls="transition-demo-1"
              aria-expanded={open1}
            >
              Fade in
            </Button>
            <Fade in={open1}>
              <Card>
                <Card.Body>
                  <div id="transition-demo-1">
                    Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus
                    terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer
                    labore wes anderson cred nesciunt sapiente ea proident.
                  </div>
                </Card.Body>
              </Card>
            </Fade>
          </div>

          <div>
            <Button
              onClick={() => setOpen2(!open2)}
              aria-controls="transition-demo-2"
              aria-expanded={open2}
            >
              Slide in from top
            </Button>
            <Collapse in={open2}>
              <div id="transition-demo-2">
                <Card>
                  <Card.Body>
                    Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus
                    terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer
                    labore wes anderson cred nesciunt sapiente ea proident.
                  </Card.Body>
                </Card>
              </div>
              
            </Collapse>
          </div>

          <div>
            <Button
              onClick={() => setOpen3(!open3)}
              aria-controls="transition-demo-3"
              aria-expanded={open3}
            >
              Slide in from left
            </Button>
            <div style={{ minHeight: '150px' }}>
              <Collapse in={open3} dimension="width">
                <div id="transition-demo-3">
                  <Card body style={{ width: '400px' }}>
                    Anim pariatur cliche reprehenderit, enim eiusmod high life
                    accusamus terry richardson ad squid. Nihil anim keffiyeh
                    helvetica, craft beer labore wes anderson cred nesciunt sapiente
                    ea proident.
                  </Card>
                </div>
              </Collapse>
            </div>
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
}