// React
import React, { useEffect, useState } from 'react';

// Third party packages
import Container from 'react-bootstrap/Container';

// Components and functions
import { getAdvisories } from '../Components/data/advisories.js';
import AdvisoriesList from '../Components/advisories/AdvisoriesList';
import Footer from '../Footer';
import PageHeader from '../PageHeader';

// Styling
import './AdvisoriesListPage.scss';

export default function AdvisoriesListPage() {
  const [advisories, setAdvisories] = useState(false);

  async function loadAdvisories() {
    const advisoriesData = await getAdvisories();
    setAdvisories(advisoriesData);
  }

  useEffect(() => {
    loadAdvisories();
  }, []);

  return (
    <div className='advisories-page'>
      <PageHeader
        title='Advisories'
        description='Get the latest critical travel status information during major events affecting travel on a highway or region.'>
      </PageHeader>
      <Container>
        <AdvisoriesList advisories={advisories} showDescriptions={true} />
      </Container>
      <Footer />
    </div>
  );
}
