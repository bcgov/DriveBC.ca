// React
import React, { useCallback, useEffect, useRef } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories } from '../slices/cmsSlice';

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
  document.title = 'DriveBC - Advisories';

  // Redux
  const dispatch = useDispatch();
  const { advisories } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
  }))));

  // Refs
  const isInitialMount = useRef(true);

  // Data loading
  const loadAdvisories = async () => {
    if (!advisories) {
      dispatch(updateAdvisories({
        list: await getAdvisories(),
        timeStamp: new Date().getTime()
      }));
    }
  }

  useEffect(() => {
    if (isInitialMount.current) { // Only run on initial load
      loadAdvisories();
      isInitialMount.current = false;
    }
  });

  return (
    <div className='advisories-page'>
      <PageHeader
        title='Advisories'
        description='Get the latest critical travel status information during major events affecting travel on a highway or region.'>
      </PageHeader>
      <Container>
        <AdvisoriesList advisories={advisories} showDescription={true} showTimestamp={true}/>
      </Container>
      <Footer />
    </div>
  );
}
