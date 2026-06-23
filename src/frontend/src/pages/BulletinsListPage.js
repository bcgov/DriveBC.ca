// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateBulletins } from '../slices/cmsSlice';

// External imports
import Container from 'react-bootstrap/Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/pro-regular-svg-icons';

// Internal imports
import { CMSContext } from '../App';
import { getBulletins, markBulletinsAsRead } from '../Components/data/bulletins.js';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import BulletinsList from '../Components/bulletins/BulletinsList';
import EmptyBulletin from '../Components/bulletins/EmptyBulletin';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import PollingComponent from "../Components/shared/PollingComponent";
import { useLocation } from "react-router-dom";

// Styling
import './BulletinsListPage.scss';

export default function BulletinsListPage() {
  const isFirstVisitRef = useRef(!sessionStorage.getItem('lastBulletinsVisit'));
  document.title = 'DriveBC - Bulletins';

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  // Redux
  const dispatch = useDispatch();
  const { bulletins } = useSelector(useCallback(memoize(state => ({
    bulletins: state.cms.bulletins.list,
  }))));

  // Refs
  const isInitialLoad = useRef(true);
  const bulletinRefs = useRef({});
  const viewedHighlightedBulletins = useRef(new Set());
  const bulletinsInViewport = useRef({});
  const trackedBulletinsRef = useRef({});
  const dismissedHighlightsRef = useRef(
    new Set(JSON.parse(sessionStorage.getItem('dismissedBulletinHighlights') || '[]'))
  );
  

  // States
  const [showLoader, setShowLoader] = useState(true);
  const [trackedBulletins, setTrackedBulletins] = useState({});
  const [updateCounts, setUpdateCounts] = useState({ above: 0, below: 0 });
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const cmsContextRef = useRef(cmsContext);
  const bulletinsRef = useRef(bulletins);

  const location = useLocation();
  const isFirstMount = useRef(true);

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);
    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }


  const dismissHighlight = (bulletinId) => {
    dismissedHighlightsRef.current.add(String(bulletinId));
    sessionStorage.setItem(
      'dismissedBulletinHighlights',
      JSON.stringify([...dismissedHighlightsRef.current])
    );

    const bulletin = bulletinsRef.current?.find(
      b => String(b.id) === String(bulletinId)
    );
    if (bulletin) {
      markBulletinsAsRead([bulletin], cmsContextRef.current, setCMSContext);
    }

    trackedBulletinsRef.current = {
      ...trackedBulletinsRef.current,
      [bulletinId]: {
        ...trackedBulletinsRef.current[bulletinId],
        highlight: false,
      }
    };
    setTrackedBulletins({ ...trackedBulletinsRef.current });
  };




  // Data loading
  const loadBulletins = async () => {
    const bulletinsData = await getBulletins().catch((error) => displayError(error));
    if (!bulletinsData) return;

    const currentContext = cmsContextRef.current;

    const trackedDict = bulletinsData.reduce((acc, bulletin) => {
      const tracked = trackedBulletinsRef.current[bulletin.id] ?? null;
      const isDismissed = dismissedHighlightsRef.current.has(String(bulletin.id));

      const notificationChanged =
      tracked !== null &&
      bulletin.last_notified_at &&
      bulletin.last_notified_at !== tracked.last_notified_at;

    if (notificationChanged) {
      dismissedHighlightsRef.current.delete(String(bulletin.id));
      sessionStorage.setItem(
        'dismissedBulletinHighlights',  // note: use the bulletin-specific key
        JSON.stringify([...dismissedHighlightsRef.current])
      );
    }

      const isUnread = !isFirstVisitRef.current &&
        bulletin.last_notified_at &&
        !currentContext.readBulletins.includes(
          bulletin.id.toString() + '-' + bulletin.last_notified_at.toString()
        );

      acc[bulletin.id] = {
        highlight: isDismissed
          ? false
          : isUnread,
        live_revision: bulletin.live_revision,
        last_notified_at: bulletin.last_notified_at,
      };
      return acc;
    }, {});


    trackedBulletinsRef.current = {
      ...trackedBulletinsRef.current,
      ...trackedDict,
    };
    setTrackedBulletins({ ...trackedBulletinsRef.current });

    dispatch(updateBulletins({
      list: bulletinsData,
      timeStamp: new Date().getTime()
    }));

    isInitialLoad.current = false;
    setShowLoader(false);
  }

  useEffect(() => {
    cmsContextRef.current = cmsContext;
  
    if (isFirstMount.current) {
      isFirstMount.current = false;
      loadBulletins();
      return;
    }
    trackedBulletinsRef.current = {};
    viewedHighlightedBulletins.current = new Set();
    setTrackedBulletins({});
    loadBulletins();
  }, [location.key]);

  useEffect(() => {
    return () => {
      if (bulletinsRef.current && bulletinsRef.current.length) {
        markBulletinsAsRead(bulletinsRef.current, cmsContextRef.current, setCMSContext);
      }
    };
  }, []);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const bulletinId = entry.target.getAttribute('data-key');
          const isHighlighted = trackedBulletins[bulletinId]?.highlight;

          if (entry.isIntersecting) {
            bulletinsInViewport.current[bulletinId] = null;
            if (isHighlighted && !viewedHighlightedBulletins.current.has(bulletinId)) {
              viewedHighlightedBulletins.current.add(bulletinId);
            }
          } else {
            delete bulletinsInViewport.current[bulletinId];
          }
        });

        // Count highlighted items above/below viewport
        const counts = { above: 0, below: 0 };
        Object.entries(bulletinRefs.current).forEach(([id, ref]) => {
          const isHighlighted = trackedBulletins[id]?.highlight;
          if (!ref || !isHighlighted || viewedHighlightedBulletins.current.has(id)) return;
          const top = ref.getBoundingClientRect().top;
          top < 0 ? counts.above++ : counts.below++;
        });
        setUpdateCounts(counts);
      },
      { rootMargin: '-58px 0px 0px 0px', threshold: 1 }
    );

    setTimeout(() => {
      Object.values(bulletinRefs.current).forEach((ref) => {
        if (ref) observer.observe(ref);
      });
    }, 0);

    return () => observer.disconnect();
  }, [bulletins, trackedBulletins]);

useEffect(() => {
  bulletinsRef.current = bulletins;
}, [bulletins]);

  useEffect(() => {
    sessionStorage.setItem(
      'lastBulletinsVisit',
      new Date().toISOString()
    );
  }, []);

  const scrollToNextHighlightedHandler = (direction) => {
    const offset = 58 + 48;
    const sortedRefs = Object.entries(bulletinRefs.current)
      .filter(([id]) => trackedBulletins[id]?.highlight && !viewedHighlightedBulletins.current.has(id))
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

  const isBulletinsEmpty = bulletins?.length === 0;

  return (
    <div className='bulletins-page cms-page'>
      <PollingComponent runnable={loadBulletins} interval={5000} />

      {showNetworkError && <NetworkErrorPopup />}
      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

      <PageHeader
        title='Bulletins'
        description='Stay safe and informed with seasonal travel updates.'>
      </PageHeader>

      <Container>
        {isBulletinsEmpty ?
          <EmptyBulletin /> :
          <BulletinsList
            bulletins={bulletins}
            showLoader={showLoader}
            trackedBulletins={trackedBulletins}
            bulletinRefs={bulletinRefs}
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