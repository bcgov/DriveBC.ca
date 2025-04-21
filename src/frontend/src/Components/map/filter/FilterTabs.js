// React
import React from 'react';

// External imports
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';

// Internal imports
import MapFilters from './MapFilters';
import Legend from "./Legend";

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

  // Rendering
  // Main Component
  return (
    <div className={'filters-menu' + (!open ? ' closed' : '')}>
      {!open &&
        <Button
          variant={isDelaysPage ? 'outline-primary' : 'primary'}
          className={'map-btn open-filters' + (open ? ' open' : '')}
          aria-label='open filters options'
          onClick={() => {
            open ? setOpen(false) : setOpen(true) }
          }>
          <span className='filters-btn__text'>{textOverride ? textOverride : 'Map Layers'}</span>

          <FontAwesomeIcon icon={faFilter} />
        </Button>
      }

      {open &&
        <div className='tabs-container'>
          <Tabs
            defaultActiveKey='layers'
            className='tabs-header'>

            <Tab eventKey='layers' title='Map layers' tabClassName='map-tab'>
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

            <Tab eventKey='legend' title='Legend' tabClassName='map-tab'>
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
