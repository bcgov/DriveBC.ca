// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from "react-router-dom";

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories } from '../slices/cmsSlice';

// External imports
import Container from 'react-bootstrap/Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/pro-regular-svg-icons';

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

  // Redux
  const dispatch = useDispatch();
  const { advisories, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    selectedRoute: state.routes.selectedRoute,
  }))));

  // Refs
  const isInitialMount = useRef(true);
  const isInitialLoad = useRef(true);
  const advisoryRefs = useRef({});
  const viewedHighlightedAdvisories = useRef(new Set());
  const advisoriesInViewport = useRef({});

  // States
  const [showLoader, setShowLoader] = useState(true);
  const [trackedAdvisories, setTrackedAdvisories] = useState({});
  const [updateCounts, setUpdateCounts] = useState({ above: 0, below: 0 });
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const trackedAdvisoriesRef = useRef({});
  const dismissedHighlightsRef = useRef(
    new Set(JSON.parse(sessionStorage.getItem('dismissedHighlights') || '[]'))
  );
  const location = useLocation();
  const isFirstMount = useRef(true);
  const dismissHighlight = (advisoryId) => {
    dismissedHighlightsRef.current.add(String(advisoryId));
    sessionStorage.setItem(
      'dismissedHighlights',
      JSON.stringify([...dismissedHighlightsRef.current])
    );

    const advisory = advisoriesRef.current?.find(
      a => String(a.id) === String(advisoryId)
    );
    if (advisory) {
      markAdvisoriesAsRead([advisory], cmsContextRef.current, setCMSContext);
    }

    trackedAdvisoriesRef.current = {
      ...trackedAdvisoriesRef.current,
      [advisoryId]: {
        ...trackedAdvisoriesRef.current[advisoryId],
        highlight: false,
      }
    };
    setTrackedAdvisories({ ...trackedAdvisoriesRef.current });
  };

  const cmsContextRef = useRef(cmsContext);
  const advisoriesRef = useRef(advisories);

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);
    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

const loadAdvisories = async () => {
  const advisoriesData = await getAdvisories().catch((error) => displayError(error));
  if (!advisoriesData) return;

  const currentContext = cmsContextRef.current;

  const trackedDict = advisoriesData.reduce((acc, advisory) => {
  const tracked = trackedAdvisoriesRef.current[advisory.id] ?? null;
  const notificationChanged =
    tracked !== null &&
    advisory.last_notified_at &&
    advisory.last_notified_at !== tracked.last_notified_at;

  if (notificationChanged) {
    dismissedHighlightsRef.current.delete(String(advisory.id));
    sessionStorage.setItem('dismissedHighlights', JSON.stringify([...dismissedHighlightsRef.current]));
  }

  const isDismissed = dismissedHighlightsRef.current.has(String(advisory.id));

  const isUnread =
    advisory.last_notified_at &&
    !currentContext.readAdvisories.includes(
      advisory.id.toString() + '-' + advisory.last_notified_at.toString()
    );

    const highlight = isDismissed
      ? false
      : tracked !== null && !notificationChanged
        ? tracked.highlight
        : !!isUnread;

  acc[advisory.id] = {
    highlight,
    live_revision: advisory.live_revision,
    last_notified_at: advisory.last_notified_at,
  };
  return acc;
}, {});

  trackedAdvisoriesRef.current = {
    ...trackedAdvisoriesRef.current,
    ...trackedDict,
  };
  setTrackedAdvisories({ ...trackedAdvisoriesRef.current });


  const filteredAdvisoriesData = selectedRoute
    ? filterAdvisoryByRoute(advisoriesData, selectedRoute)
    : advisoriesData;

  dispatch(updateAdvisories({
    list: advisoriesData,
    filteredList: filteredAdvisoriesData,
    timeStamp: new Date().getTime()
  }));

  isInitialLoad.current = false;
  isInitialMount.current = false;
  setShowLoader(false);
};

useEffect(() => {
  if (!advisories?.length) return;

  const initialTracked = advisories.reduce((acc, advisory) => {
    const isDismissed = dismissedHighlightsRef.current.has(String(advisory.id));
    const isUnread =
      advisory.last_notified_at &&
      !cmsContext.readAdvisories.includes(
        advisory.id.toString() + '-' + advisory.last_notified_at.toString()
      );
    acc[advisory.id] = {
      highlight: isDismissed ? false : !!isUnread,
      live_revision: advisory.live_revision,
      last_notified_at: advisory.last_notified_at,
    };
    return acc;
  }, {});

  trackedAdvisoriesRef.current = initialTracked;
  setTrackedAdvisories(initialTracked);
}, []);

useEffect(() => {
  cmsContextRef.current = cmsContext;

  if (isFirstMount.current) {
    isFirstMount.current = false;
    loadAdvisories();
    return;
  }
  trackedAdvisoriesRef.current = {};
  viewedHighlightedAdvisories.current = new Set();

  setTrackedAdvisories({});

  loadAdvisories();
}, [location.key]);

useEffect(() => {
  return () => {
    if (advisoriesRef.current && advisoriesRef.current.length) {
      markAdvisoriesAsRead(advisoriesRef.current, cmsContextRef.current, setCMSContext);
    }
  };
}, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const advisoryId = entry.target.getAttribute('data-key');
          const isHighlighted = trackedAdvisories[advisoryId]?.highlight;

          if (entry.isIntersecting) {
            advisoriesInViewport.current[advisoryId] = null;
            if (isHighlighted && !viewedHighlightedAdvisories.current.has(advisoryId)) {
              viewedHighlightedAdvisories.current.add(advisoryId);
            }
          } else {
            delete advisoriesInViewport.current[advisoryId];
          }
        });

        // Count highlighted items above/below viewport
        const counts = { above: 0, below: 0 };
        Object.entries(advisoryRefs.current).forEach(([id, ref]) => {
          const isHighlighted = trackedAdvisories[id]?.highlight;
          if (!ref || !isHighlighted || viewedHighlightedAdvisories.current.has(id)) return;
          const top = ref.getBoundingClientRect().top;
          top < 0 ? counts.above++ : counts.below++;
        });
        setUpdateCounts(counts);
      },
      { rootMargin: '-58px 0px 0px 0px', threshold: 1 }
    );

    setTimeout(() => {
      Object.values(advisoryRefs.current).forEach((ref) => {
        if (ref) observer.observe(ref);
      });
    }, 0);

    return () => observer.disconnect();
  }, [advisories, trackedAdvisories]);

  useEffect(() => {
  cmsContextRef.current = cmsContext;
}, [cmsContext]);

useEffect(() => {
  advisoriesRef.current = advisories;
}, [advisories]);

  // Handlers

  const scrollToNextHighlightedHandler = (direction) => {
    const offset = 58 + 48;
    const sortedRefs = Object.entries(advisoryRefs.current)
      .filter(([id, ref]) => trackedAdvisories[id]?.highlight && !viewedHighlightedAdvisories.current.has(id))
      .map(([id, ref]) => ({
        id,
        top: Math.floor(ref.getBoundingClientRect().top + window.scrollY - offset)
      }))
      .sort((a, b) => a.top - b.top);

    const currentScroll = Math.floor(window.scrollY);
    let nextTop;

    if (direction === 'above') {
      nextTop = sortedRefs.reverse().find(r => r.top < currentScroll)?.top;
    } else {
      nextTop = sortedRefs.find(r => r.top > currentScroll)?.top;
    }

    if (nextTop !== undefined) {
      document.querySelector('#main')?.scrollTo({ top: nextTop, behavior: 'smooth' });
    }
  };

  const isAdvisoriesEmpty = advisories?.length === 0;

  return (
    <div className='advisories-page'>
      <PollingComponent runnable={loadAdvisories} interval={5000} />

      {showNetworkError && <NetworkErrorPopup />}
      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

      <PageHeader
        title='Advisories'
        description='Get the latest critical info impacting travel on a highway or region.'>
      </PageHeader>

      <Container>
        {isAdvisoriesEmpty ?
          <EmptyAdvisory /> :
          <AdvisoriesList
            advisories={advisories}
            isAdvisoriesListPage={true}
            showLoader={showLoader}
            trackedAdvisories={trackedAdvisories}
            advisoryRefs={advisoryRefs}
            dismissHighlight={dismissHighlight}
          />
        }
      </Container>

      {updateCounts.above > 0 &&
        <button className="update-count-pill top" onClick={() => scrollToNextHighlightedHandler('above')}>
          <FontAwesomeIcon icon={faArrowUp} /> {updateCounts.above} update{updateCounts.above !== 1 ? 's' : ''} available
        </button>
      }
      {updateCounts.below > 0 &&
        <button className="update-count-pill bottom" onClick={() => scrollToNextHighlightedHandler('below')}>
          <FontAwesomeIcon icon={faArrowDown} /> {updateCounts.below} update{updateCounts.below !== 1 ? 's' : ''} available
        </button>
      }

      <Footer />
    </div>
  );
}
