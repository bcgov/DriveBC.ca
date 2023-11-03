// React
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

// Third party packages
import Container from 'react-bootstrap/Container';
import parse from 'html-react-parser';

// Components and functions
import { getBulletins } from '../Components/data/bulletins.js';
import Footer from '../Footer.js';
import FriendlyTime from '../Components/FriendlyTime';

// Styling
import './BulletinDetailsPage.scss';

export default function BulletinDetailsPage() {
  // Context and router data
  const params = useParams();
  const isInitialMount = useRef(true);
  const [bulletin, setBulletin] = useState(null);

  // Data function and initialization
  const loadBulletin = async () => {
    const bulletinData = await getBulletins(params.id);
    setBulletin(bulletinData);
    isInitialMount.current = false;
  };

  useEffect(() => {
    loadBulletin();
  }, []);

  // Rendering
  return (
    <div className='bulletin-page cms-page'>
      {bulletin && (
        <div>
          <div className="page-header">
            <Container>
              <h1 className="page-title">{bulletin.title}</h1>

              <div className="timestamp-container">
                <span>{bulletin.first_published_at != bulletin.last_published_at ? "Last updated" : "Published" }</span>
                <FriendlyTime date={bulletin.latest_revision_created_at} />
              </div>
            </Container>
          </div>

          {bulletin.teaser &&
            <Container>
              <p>{bulletin.teaser}</p>
            </Container>
          }

          <Container className="bulletin-body-container cms-body">
            <p>{parse(bulletin.body)}</p>
          </Container>
        </div>
      )}

      <Footer />
    </div>
  );
}
