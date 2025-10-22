// React
import React, { useState, useEffect } from 'react';

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

  const smallScreen = useMediaQuery('only screen and (max-width : 768px)');

  // States
  const [activeTab, setActiveTab] = useState('layers');
  const [mapContainer, setMapContainer] = useState(null);

  // Find the map element on component mount
  useEffect(() => {
    const container = document.querySelector('.map-container');
    if (container) {
      setMapContainer(container);
    }
  }, []);

  // Rendering
  // Sub components
  const getTabsContainer = () => {
    return (
      <div className={(smallScreen ? `mobile-filter-tabs` : `filter-tabs`) + (open ? '' : ' hide')}>
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

          <Tab eventKey='legend' title='Legend' tabClassName='map-tab legend'>
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
        {!smallScreen && (
          <span className='filters-btn__text'>{textOverride ? textOverride : 'Map Layers'}</span>
        )}
      </Button>

      {smallScreen && mapContainer &&
        createPortal(getTabsContainer(), mapContainer)
      }

      {!smallScreen && getTabsContainer()}
    </div>
  );
}
