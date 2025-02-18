// React
import React, { useCallback, useContext, useEffect, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories } from '../slices/cmsSlice';

// External imports
import Container from 'react-bootstrap/Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation,
} from '@fortawesome/pro-regular-svg-icons';

// Internal imports
import { CMSContext } from '../App';
import { getAdvisories } from '../Components/data/advisories.js';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import AdvisoriesList from '../Components/advisories/AdvisoriesList';
import EmptyAdvisory from '../Components/advisories/EmptyAdvisory';
import Footer from '../Footer';
import PageHeader from '../PageHeader';

// Styling
import './AdvisoriesListPage.scss';

export default function AdvisoriesListPage() {
  document.title = 'DriveBC - Advisories';

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);
  const [showLoader, setShowLoader] = useState(true);

  // Redux
  const dispatch = useDispatch();
  const { advisories } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
  }))));

  // UseState hooks
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

  // Data loading
  const loadAdvisories = async () => {
    let advisoriesData = advisories;

    if (!advisoriesData) {
      advisoriesData = await getAdvisories().catch((error) => displayError(error));

      dispatch(updateAdvisories({
        list: advisoriesData,
        timeStamp: new Date().getTime()
      }));
    }

    const advisoriesIds = advisoriesData.map(advisory => advisory.id.toString() + '-' + advisory.live_revision.toString());

    // Combine and remove duplicates
    const readAdvisories = Array.from(new Set([...advisoriesIds, ...cmsContext.readAdvisories]));
    const updatedContext = {...cmsContext, readAdvisories: readAdvisories};

    setCMSContext(updatedContext);
    localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
  }

  useEffect(() => {
    loadAdvisories();
  }, []);

  useEffect(() => {
    if (advisories) {
      // setShowLoader(false);
      // Simulate a delay for the loader, shold be removed once the code review is done
      setTimeout(() => {
        setShowLoader(false);
      }, 1000);
    } else {
      setShowLoader(true);
    }
  }, [advisories]);

  const isAdvisoriesEmpty = advisories?.length === 0;

  return (
    <div className='advisories-page'>
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

      <PageHeader
        title='Advisories'
        description='Get the latest critical info impacting travel on a highway or region.'>
      </PageHeader>

      <div className="beta-message-container">
        <div className="beta-message">
          <p className="beta-message__title"><FontAwesomeIcon icon={faCircleExclamation} />This is a beta version of DriveBC.</p>

          <p className="beta-message__content">
            Advisories shared on the beta version are for feedback purposes and
            possibly not up-to-date.  Please continue to refer to the Ministry&apos;s
            TranBC site under <a href="https://www.tranbc.ca/current-travel-advisories/">Current Road
            Advisories and Information</a>.
          </p>
        </div>
      </div>

      <Container>
          {isAdvisoriesEmpty ? (
          <EmptyAdvisory/>
        ) : (
          <AdvisoriesList advisories={advisories} isAdvisoriesListPage={true} showLoader={showLoader} />
      )}
      </Container>

      <Footer />
    </div>
  );
}
