// React
import React, { useCallback, useEffect, useState, useRef } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateBulletins } from '../slices/cmsSlice';

// External imports
import Container from 'react-bootstrap/Container';

// Styling
import './BulletinsListPage.scss';

// Internal imports
import { getBulletins } from '../Components/data/bulletins.js';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
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

  // States
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  // Refs
  const isInitialMount = useRef(true);

  // Data loading
  const loadBulletins = async () => {
    if (!bulletins) {
      dispatch(updateBulletins({
        list: await getBulletins().catch((error) => displayError(error)),
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

  const isBulletinsEmpty = bulletins?.length === 0;

  return (
    <div className='bulletins-page'>
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

      <PageHeader
        title='Bulletins'
        description='Stay safe and informed with seasonal travel updates.'>
      </PageHeader>

      <Container>
          {isBulletinsEmpty ? (
          <EmptyBulletin/>
        ) : (
          <BulletinsList bulletins={bulletins} />
        )}
      </Container>

      <Footer />
    </div>
  );
}
