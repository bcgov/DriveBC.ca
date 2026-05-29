// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/pro-solid-svg-icons";
import Container from 'react-bootstrap/Container';

// Styling
import './PageHeader.scss';

export default function PageHeader(props) {
  /* Setup */
  // Props
  const { title, description, returnHandler } = props;

  /* Rendering */
  // Main component
  return (
    <div className="page-header">
      <Container>
        {returnHandler &&
          <div className="back-link-wrap">
            <a
              className="back-link"
              onClick={returnHandler}
              onKeyDown={keyEvent => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  returnHandler();
                }
              }}>
              <FontAwesomeIcon icon={faArrowLeft} />
              Back
            </a>
          </div>
        }

        <h1 className="page-title">{title}</h1>
        <p className="page-description body--large">{description}</p>
      </Container>
    </div>
  );
}
