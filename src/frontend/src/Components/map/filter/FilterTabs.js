// React
import React, { useState } from 'react';

// External imports
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup
} from '@fortawesome/pro-solid-svg-icons';
import {
  faXmark
} from '@fortawesome/pro-regular-svg-icons';
import Button from 'react-bootstrap/Button';

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

  // States
  const [activeTab, setActiveTab] = useState('layers');

  // Rendering
  // Main Component
  return (
    <div className={'filters-menu'  + (!open ? ' closed' : '') + (activeTab === 'layers' ? ' layers-tab' : ' legend-tab')}>
      <Button
        variant={isDelaysPage ? 'outline-primary' : 'primary'}
        className={'map-btn open-filters' + (open ? ' hide' : '')}
        aria-label='open filters options'
        onClick={() => {
          open ? setOpen(false) : setOpen(true) }
        }>
        <FontAwesomeIcon icon={faLayerGroup} />
        <span className='filters-btn__text'>{textOverride ? textOverride : 'Map Layers'}</span>
      </Button>

      <div className={`tabs-container` + (open ? '' : ' hide')}>
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
          onClick={() => setOpen(false)} >

          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
}
