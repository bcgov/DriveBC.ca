// React
import React, { useEffect, useState } from 'react';

// Third party packages
import Container from 'react-bootstrap/Container';

// Styling
import './BulletinsListPage.scss';

// Components and functions
import { getBulletins } from '../Components/data/bulletins.js';
import BulletinsList from '../Components/bulletins/BulletinsList';
import Footer from '../Footer';
import PageHeader from '../PageHeader';


export default function BulletinsListPage() {
  const [bulletins, setBulletins] = useState(false);

  async function loadBulletins() {
    const bulletinsData = await getBulletins();
    setBulletins(bulletinsData);
  }

  useEffect(() => {
    loadBulletins();
  }, []);

  return (
    <div className='bulletins-page'>
      <PageHeader
        title='Bulletins'
        description='Get the latest critical travel status information during major events affecting travel on a highway or region.'>
      </PageHeader>
      <Container>
        <BulletinsList bulletins={bulletins} />
      </Container>
      <Footer />
    </div>
  );
}
