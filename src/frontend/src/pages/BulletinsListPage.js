// React
import React, { useCallback, useEffect, useRef } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateBulletins } from '../slices/cmsSlice';

// External Components
import Container from 'react-bootstrap/Container';

// Styling
import './BulletinsListPage.scss';

// Components and functions
import { getBulletins } from '../Components/data/bulletins.js';
import BulletinsList from '../Components/bulletins/BulletinsList';
import EmptyBulletin from '../Components/bulletins/EmptyBulletin';
import Footer from '../Footer';
import PageHeader from '../PageHeader';

export default function BulletinsListPage() {
  document.title = 'DriveBC - Bulletins';

  // Redux
  const dispatch = useDispatch();
  const { bulletins } = useSelector(useCallback(memoize(state => ({
    bulletins: state.cms.bulletins.list,
  }))));

  // Refs
  const isInitialMount = useRef(true);

  // Data loading
  const loadBulletins = async () => {
    if (!bulletins) {
      dispatch(updateBulletins({
        list: await getBulletins(),
        timeStamp: new Date().getTime()
      }));
    }
  }

  useEffect(() => {
    if (isInitialMount.current) { // Only run on initial load
      loadBulletins();
      isInitialMount.current = false;
    }
  });

  const filteredBulletins = bulletins?.filter(bulletin => !bulletin.title.includes('No bulletins'));
  const isFilteredBulletinsEmpty = filteredBulletins?.length === 0;

  return (
    <div className='bulletins-page'>
      <PageHeader
        title='Bulletins'
        description='Find information regarding seasonal safety campaigns, and DriveBC related updates.'>
      </PageHeader>

      <Container>        
          {isFilteredBulletinsEmpty ? (
          <EmptyBulletin bulletin={bulletins[0]}/>
        ) : (
          <BulletinsList bulletins={filteredBulletins} />
        )}
      </Container>

      <Footer />
    </div>
  );
}
