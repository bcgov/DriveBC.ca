// React
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

// External imports
import { createPortal } from 'react-dom';
import { useMediaQuery } from "@uidotdev/usehooks";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup
} from '@fortawesome/pro-solid-svg-icons';
import {
  faXmark
} from '@fortawesome/pro-regular-svg-icons';
import Button from 'react-bootstrap/Button';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

// Internal imports
import Legend from "./Legend";
import MapFilters from './MapFilters';
import trackEvent from "../../shared/TrackEvent";

// Styling
import './FilterTabs.scss';

export default function FilterTabs(props) {
  // Props
  const {
    mapLayers,
    callback,
    disableFeatures,
    enableRoadConditions,
    enableChainUps,
    textOverride,
    referenceData,
    loadingLayers,
    isDelaysPage,
    open,
    setOpen
  } = props;

  const viewportNarrowForFilters = useMediaQuery('only screen and (max-width : 768px)');
  const smallScreen = viewportNarrowForFilters;
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // States
  const [activeTab, setActiveTab] = useState('layers');
  const [mapContainer, setMapContainer] = useState(null);
  // Stays true while the card slides out, so it isn't hidden mid-slide
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);

  // Refs
  const tabsContainerRef = useRef(null);
  const menuRef = useRef(null);
  const slideRef = useRef(null);
  const isInitialMount = useRef(true);

  // Desktop: slide the card in and out
  useLayoutEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const menu = menuRef.current;
    if (smallScreen || !menu || reduceMotion) {
      setShown(open);
      return;
    }

    const offscreen = { transform: 'translateX(calc(100% + 16px))' };
    const onscreen = { transform: 'none' };

    // Start from wherever a slide in progress has the card, so reopening mid-close doesn't jump
    const current = getComputedStyle(menu).transform;
    slideRef.current?.cancel();
    const start = current !== 'none' ? { transform: current } : (open ? offscreen : onscreen);

    slideRef.current = menu.animate([start, open ? onscreen : offscreen], {
      duration: 250,
      easing: 'ease-in-out',
      fill: open ? 'none' : 'forwards',
    });

    if (!open) {
      slideRef.current.finished.then(() => setShown(false), () => {});
    }
  }, [open]);

  // Find the map element on component mount
  useEffect(() => {
    const container = document.querySelector('.map-container');
    if (container) {
      setMapContainer(container);
    }
  }, []);

  // Keep arrow keys from panning the map; left/right switch tabs here since react-bootstrap's handler is skipped
  useEffect(() => {
    const tabsContainer = tabsContainerRef.current;
    if (!tabsContainer) return;

    const stopArrowPropagation = (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      e.stopPropagation();

      if (['ArrowLeft', 'ArrowRight'].includes(e.key) && e.target.getAttribute('role') === 'tab') {
        e.preventDefault();
        const tabs = [...tabsContainer.querySelectorAll('[role="tab"]')];
        const offset = e.key === 'ArrowLeft' ? -1 : 1;
        const nextTab = tabs[(tabs.indexOf(e.target) + offset + tabs.length) % tabs.length];
        nextTab.click();
        nextTab.focus();
      }
    };

    tabsContainer.addEventListener('keydown', stopArrowPropagation);
    return () => tabsContainer.removeEventListener('keydown', stopArrowPropagation);
  }, [smallScreen, mapContainer]);

  // Rendering
  // Sub components
  const getTabsContainer = () => {
    return (
      <div ref={tabsContainerRef} className={(smallScreen ? `mobile-filter-tabs` : `filter-tabs`) + (shown ? '' : ' hide')}>
        <Tabs
          defaultActiveKey='layers'
          className='tabs-header'
          onSelect={(key) => {
            setActiveTab(key);
            trackEvent('click', 'map', `Show ${key} tab`);
          }}>

          <Tab eventKey='layers' title='Map options' tabClassName='map-tab layers'>
            <MapFilters
              mapLayers={mapLayers}
              callback={callback}
              disableFeatures={disableFeatures}
              enableRoadConditions={enableRoadConditions}
              enableChainUps={enableChainUps}
              referenceData={referenceData}
              loadingLayers={loadingLayers} />
          </Tab>

          <Tab eventKey='legend' title='Legend' tabClassName='map-tab legend' tabIndex={0}>
            <Legend />
          </Tab>
        </Tabs>

        <button
          className='close-filters'
          aria-label='close filters options'
          onClick={() => setOpen(false)}>

          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    );
  }

  // Main Component
  return (
    <React.Fragment>
      {/* Outside the card so it stays put underneath while the card slides away */}
      <Button
        variant={isDelaysPage ? 'outline-primary' : 'primary'}
        className={'map-btn open-filters' + (open ? ' hide' : '')  + (smallScreen ? ' fixed-to-mobile-panel' : '')}
        aria-label='open filters options'
        onClick={() => {
          open ? setOpen(false) : setOpen(true)
        }}>
        <FontAwesomeIcon icon={faLayerGroup}/>
        <span className='filters-btn__text'>{textOverride ? textOverride : 'Map options'}</span>
      </Button>

      <div ref={menuRef} className={'filters-menu'  + (!shown ? ' closed' : '') + (activeTab === 'layers' ? ' layers-tab' : ' legend-tab')}>
        {smallScreen && mapContainer &&
          createPortal(getTabsContainer(), mapContainer)
        }

        {!smallScreen && getTabsContainer()}
      </div>
    </React.Fragment>
  );
}
