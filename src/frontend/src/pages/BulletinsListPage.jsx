// React
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { useSearchParams } from "react-router-dom";
// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateBulletins } from '../slices/cmsSlice';

// External imports
import Container from 'react-bootstrap/Container';

// Styling
import './BulletinsListPage.scss';

// Internal imports
import { CMSContext } from '../App';
import { getBulletins, markBulletinsAsRead } from '../Components/data/bulletins';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import BulletinsList from '../Components/bulletins/BulletinsList';
import EmptyBulletin from '../Components/bulletins/EmptyBulletin';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import PollingComponent from "../Components/shared/PollingComponent";

export default function BulletinsListPage() {
  document.title = 'DriveBC - Bulletins';
  // const [searchParams] = useSearchParams();
  // const isPreview = searchParams.get("preview") === "true";

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  // Redux
  const dispatch = useDispatch();
  const { bulletins } = useSelector(useCallback(memoize(state => ({
    bulletins: state.cms.bulletins.list,
  }))));

  // States
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

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
    // Skip loading if the bulletins are already loaded on launch
    if (bulletins && isInitialMount.current) {
      isInitialMount.current = false;
      setShowLoader(false);
      return;
    }

    let bulletinsData = bulletins;
    if (!bulletinsData) {
      bulletinsData = await getBulletins().catch((error) => displayError(error));

      dispatch(updateBulletins({
        list: bulletinsData,
        timeStamp: new Date().getTime()
      }));
    }

    isInitialMount.current = false;
    markBulletinsAsRead(bulletinsData, cmsContext, setCMSContext);
    setShowLoader(false);
  }

  useEffect(() => {
    loadBulletins();
  }, [showLoader]);

  const isBulletinsEmpty = bulletins?.length === 0;

  return (
    <div className='bulletins-page cms-page'>
      <PollingComponent runnable={() => setShowLoader(true)} interval={30000} />
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
        {isBulletinsEmpty ?
          <EmptyBulletin/> :

          <BulletinsList bulletins={bulletins} showLoader={showLoader} />
        }
      </Container>

      <Footer />
    </div>
  );
}
