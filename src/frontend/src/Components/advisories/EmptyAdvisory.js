// React
import React from 'react';
// Styling
import './AdvisoriesList.scss';
import Container from 'react-bootstrap/Container';
import parse from 'html-react-parser';

export default function EmptyAdvisory(props) {
  const { advisory } = props;

  // Rendering
  return (
    <div>
      <h4 className='advisory-li-title'>{props.advisory.title}</h4>
      {advisory && (
            <Container className="advisory-body-container cms-body">
              <p>{parse(advisory.body)}</p>
            </Container>
          )}
    </div>
  );
}
