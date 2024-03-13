// React
import React from 'react';
// Styling
import './BulletinsList.scss';
import Container from 'react-bootstrap/Container';
import parse from 'html-react-parser';

export default function EmptyBulletin(props) {
  const { bulletin } = props;

  // Rendering
  return (
    <div>
      <h4 className='bulletin-li-title'>{props.bulletin.title}</h4>
      {bulletin && (
            <Container className="bulletin-body-container cms-body">
              <p>{parse(bulletin.body)}</p>
            </Container>
          )}
    </div>
  );
}
