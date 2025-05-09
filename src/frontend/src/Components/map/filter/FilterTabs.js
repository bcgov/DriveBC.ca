// React
import React, {
  useRef,
  useEffect,
  useState,
  useContext
} from 'react';

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
import { useMediaQuery } from '@uidotdev/usehooks';

// Internal imports
import { HeaderHeightContext } from  '../../../App.js';
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

  const { headerHeightContext, setHeaderHeightContext } = useContext(HeaderHeightContext);

  // Media queries
  const smallScreen = useMediaQuery('only screen and (max-width : 575px)');
  const landscape = useMediaQuery('only screen and (orientation: landscape) and (hover: none) and (pointer: coarse)');

  // Rendering
  // Main Component
  return (
    <div className={'filters-menu'  + (!open ? ' closed' : '')} style={smallScreen || landscape ? { height: `calc(99vh - ${headerHeightContext}px)` } : {}}>
      {!open &&
        <Button
          variant={isDelaysPage ? 'outline-primary' : 'primary'}
          className={'map-btn open-filters' + (open ? ' open' : '')}
          aria-label='open filters options'
          onClick={() => {
            open ? setOpen(false) : setOpen(true) }
          }>
          <FontAwesomeIcon icon={faLayerGroup} />
          <span className='filters-btn__text'>{textOverride ? textOverride : 'Map Layers'}</span>
        </Button>
      }

      {open &&
        <div className='tabs-container'>
          <Tabs
            defaultActiveKey='layers'
            className='tabs-header'>

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

            <Tab eventKey='legend' title='Legend' tabClassName='map-tab legend'
              onClick={() => {
                trackEvent('click', 'map', 'Show legend');
              }}>
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
      }
    </div>
  );
}
