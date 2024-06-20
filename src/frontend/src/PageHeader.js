import React from 'react';
import './PageHeader.scss';

import Container from 'react-bootstrap/Container';

export default function PageHeader({title, description}) {
  return (
    <div className="page-header">
      <Container>
        <h1 className="page-title">{title}</h1>
        <p className="page-description body--large">{description}</p>
      </Container>
    </div>
  );
}
