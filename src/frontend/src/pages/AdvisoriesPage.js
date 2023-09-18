// React
import React from 'react';

// Third party packages
import Container from 'react-bootstrap/Container';

// Components and functions
import PageHeader from '../PageHeader';
import Footer from '../Footer';
import AdvisoriesList from '../Components/advisories/AdvisoriesList';

export default function AdvisoriesPage() {
  return (
    <div className='advisories-page'>
      <PageHeader
        title='Advisories'
        description='Get the latest critical travel status information during major events affecting travel on a highway or region.'>
      </PageHeader>
      <Container>
        <AdvisoriesList />
      </Container>
      <Footer />
    </div>
  );
}
