// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories } from '../slices/cmsSlice';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation,
} from '@fortawesome/pro-regular-svg-icons';
import Container from 'react-bootstrap/Container';

// Internal imports
import { CMSContext } from '../App';
import { filterAdvisoryByRoute } from "../Components/map/helpers";
import { getAdvisories, markAdvisoriesAsRead } from '../Components/data/advisories.js';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import AdvisoriesList from '../Components/advisories/AdvisoriesList';
import EmptyAdvisory from '../Components/advisories/EmptyAdvisory';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import PollingComponent from "../Components/shared/PollingComponent";

// Styling
import './AdvisoriesListPage.scss';

export default function AdvisoriesListPage() {
  document.title = 'DriveBC - Advisories';

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);
  const [showLoader, setShowLoader] = useState(true);

  // Redux
  const dispatch = useDispatch();
  const { advisories, filteredAdvisories, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    filteredAdvisories: state.cms.advisories.filteredList,
    selectedRoute: state.routes.selectedRoute,
  }))));

  // Refs
  const isInitialMount = useRef(true);

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

  // Data loading
  const loadAdvisories = async () => {
    // Skip loading if the advisories are already loaded on launch
    if (advisories && isInitialMount.current) {
      isInitialMount.current = false;
      setShowLoader(false);
      return;
    }

    const advisoriesData = await getAdvisories().catch((error) => displayError(error));
    const filteredAdvisoriesData = selectedRoute ? filterAdvisoryByRoute(advisoriesData, selectedRoute) : advisoriesData;
    dispatch(updateAdvisories({
      list: advisoriesData,
      filteredList: filteredAdvisoriesData,
      timeStamp: new Date().getTime()
    }));

    markAdvisoriesAsRead(filteredAdvisoriesData, cmsContext, setCMSContext);

    isInitialMount.current = false;
    setShowLoader(false);
  }

  useEffect(() => {
    loadAdvisories();
  }, [showLoader]);

  const isAdvisoriesEmpty = advisories?.length === 0;

  return (
    <div className='advisories-page'>
      <PollingComponent runnable={() => setShowLoader(true)} interval={30000} />

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
        {isAdvisoriesEmpty ?
          <EmptyAdvisory/> :

          <AdvisoriesList advisories={filteredAdvisories} isAdvisoriesListPage={true} showLoader={showLoader} />
        }
      </Container>

      <Footer />
    </div>
  );
}
