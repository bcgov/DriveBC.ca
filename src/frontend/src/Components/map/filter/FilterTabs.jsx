// React
import React, { useState, useEffect, useRef } from 'react';

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
    isCamDetail,
    referenceData,
    loadingLayers,
    isDelaysPage,
    open,
    setOpen
  } = props;

  const viewportNarrowForFilters = useMediaQuery('only screen and (max-width : 768px)');
  const smallScreen = viewportNarrowForFilters || !!isCamDetail;

  // States
  const [activeTab, setActiveTab] = useState('layers');
  const [mapContainer, setMapContainer] = useState(null);

  // Refs
  const tabsContainerRef = useRef(null);

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
      <div ref={tabsContainerRef} className={(smallScreen ? `mobile-filter-tabs` : `filter-tabs`) + (open ? '' : ' hide')}>
        <Tabs
          defaultActiveKey='layers'
          className='tabs-header'
          onSelect={(key) => {
            setActiveTab(key);
            trackEvent('click', 'map', `Show ${key} tab`);
          }}>

          <Tab eventKey='layers' title='Map layers' tabClassName='map-tab layers'>
            <MapFilters
              mapLayers={mapLayers}
              callback={callback}
              disableFeatures={disableFeatures}
              enableRoadConditions={enableRoadConditions}
              enableChainUps={enableChainUps}
              isCamDetail={isCamDetail}
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
    <div className={'filters-menu'  + (!open ? ' closed' : '') + (activeTab === 'layers' ? ' layers-tab' : ' legend-tab')}>
      <Button
        variant={isDelaysPage ? 'outline-primary' : 'primary'}
        className={'map-btn open-filters' + (open ? ' hide' : '')  + (smallScreen ? ' fixed-to-mobile-panel' : '')}
        aria-label='open filters options'
        onClick={() => {
          open ? setOpen(false) : setOpen(true)
        }}>
        <FontAwesomeIcon icon={faLayerGroup}/>
        <span className='filters-btn__text'>{textOverride ? textOverride : 'Map Layers'}</span>
      </Button>

      {smallScreen && mapContainer &&
        createPortal(getTabsContainer(), mapContainer)
      }

      {!smallScreen && getTabsContainer()}
    </div>
  );
}
