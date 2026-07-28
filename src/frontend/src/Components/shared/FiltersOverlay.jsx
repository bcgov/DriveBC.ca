// React
import React, { useCallback, useContext, useEffect, useState } from 'react';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faSliders, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { faArrowUpArrowDown } from '@fortawesome/pro-regular-svg-icons';
import Button from 'react-bootstrap/Button';

// Internal imports
import { FilterContext, MapContext } from '../../App';
import AreaFilter from './AreaFilter';
import DelayTypeFilter, {
  getDelayTypeState,
  toDelayTypeLayerVisibility,
} from './DelayTypeFilter';
import FilterOptionsSearch from './FilterOptionsSearch';
import HighwayFilter from './HighwayFilter';

// Styling
import './FiltersOverlay.scss';

const AreaFilterIcon = () => (
  <svg className="area-filter-btn__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.9933 7.00752C10.9933 8.37761 9.16667 10.817 8.36667 11.8195C8.17333 12.0602 7.82 12.0602 7.62667 11.8195C6.82667 10.817 5 8.37761 5 7.00752C5 5.35004 6.34667 4 8 4C9.65333 4 11 5.35004 11 7.00752H10.9933ZM10.2467 7.00752C10.2467 5.76441 9.24 4.74854 7.99333 4.74854C6.74667 4.74854 5.74 5.75773 5.74 7.00752C5.74 7.20134 5.81333 7.50209 5.98 7.90309C6.14667 8.29073 6.38 8.71846 6.64667 9.15288C7.09333 9.87469 7.60667 10.5764 7.99333 11.071C8.38 10.5698 8.89333 9.87469 9.34 9.15288C9.60667 8.71846 9.84 8.29073 10.0067 7.90309C10.1733 7.50209 10.2467 7.20134 10.2467 7.00752ZM6.74667 7.00752C6.74667 6.55973 6.98667 6.14536 7.37333 5.92481C7.76 5.70426 8.23333 5.70426 8.62667 5.92481C9.02 6.14536 9.25333 6.55973 9.25333 7.00752C9.25333 7.45531 9.01333 7.86967 8.62667 8.09023C8.24 8.31078 7.76667 8.31078 7.37333 8.09023C6.98 7.86967 6.74667 7.45531 6.74667 7.00752ZM8.49333 7.00752C8.49333 6.7335 8.26667 6.50627 7.99333 6.50627C7.72 6.50627 7.49333 6.7335 7.49333 7.00752C7.49333 7.28154 7.72 7.50877 7.99333 7.50877C8.26667 7.50877 8.49333 7.28154 8.49333 7.00752Z" fill="currentColor"/>
                <path d="M3.14031 0H3.99491C4.30691 0 4.56465 0.257736 4.56465 0.569733C4.56465 0.881729 4.30691 1.13947 3.99491 1.13947H3.14031C2.03476 1.13947 1.13947 2.03476 1.13947 3.14031V3.99491C1.13947 4.30691 0.881729 4.56465 0.569733 4.56465C0.257736 4.56465 0 4.30691 0 3.99491V3.14031C0 1.40398 1.41077 0 3.14031 0ZM0.569733 5.71089C0.881729 5.71089 1.13947 5.96863 1.13947 6.28063V9.70581C1.13947 10.0178 0.881729 10.2755 0.569733 10.2755C0.257736 10.2755 0 10.0178 0 9.70581V6.28063C0 5.96863 0.257736 5.71089 0.569733 5.71089ZM1.14625 11.9983V12.8529C1.14625 13.9585 2.04154 14.8538 3.1471 14.8538H4.0017C4.31369 14.8538 4.57143 15.1115 4.57143 15.4235C4.57143 15.7355 4.31369 15.9932 4.0017 15.9932H3.1471C1.41077 15.9932 0.00678253 14.5892 0.00678253 12.8529V11.9983C0.00678253 11.6863 0.264519 11.4286 0.576515 11.4286C0.888512 11.4286 1.14625 11.6863 1.14625 11.9983ZM5.71768 0.569733C5.71768 0.257736 5.97541 0 6.28741 0H9.71937C10.0314 0 10.2891 0.257736 10.2891 0.569733C10.2891 0.881729 10.0314 1.13947 9.71937 1.13947H6.28741C5.97541 1.13947 5.71768 0.881729 5.71768 0.569733ZM6.28741 16C5.97541 16 5.71768 15.7423 5.71768 15.4303C5.71768 15.1183 5.97541 14.8605 6.28741 14.8605H9.71937C10.0314 14.8605 10.2891 15.1183 10.2891 15.4303C10.2891 15.7423 10.0314 16 9.71937 16H6.28741ZM15.4303 4.57143C15.1183 4.57143 14.8605 4.31369 14.8605 4.0017V3.1471C14.8605 2.04154 13.9652 1.14625 12.8597 1.14625H12.0051C11.6931 1.14625 11.4354 0.888512 11.4354 0.576515C11.4354 0.264519 11.6931 0.00678253 12.0051 0.00678253H12.8597C14.596 0.00678253 16 1.41077 16 3.1471V4.0017C16 4.31369 15.7423 4.57143 15.4303 4.57143ZM16 11.9983V12.8529C16 14.5892 14.5892 15.9932 12.8597 15.9932H12.0051C11.6931 15.9932 11.4354 15.7355 11.4354 15.4235C11.4354 15.1115 11.6931 14.8538 12.0051 14.8538H12.8597C13.9652 14.8538 14.8605 13.9585 14.8605 12.8529V11.9983C14.8605 11.6863 15.1183 11.4286 15.4303 11.4286C15.7423 11.4286 16 11.6863 16 11.9983ZM15.4303 5.71089C15.7423 5.71089 16 5.96863 16 6.28063V9.70581C16 10.0178 15.7423 10.2755 15.4303 10.2755C15.1183 10.2755 14.8605 10.0178 14.8605 9.70581V6.28063C14.8605 5.96863 15.1183 5.71089 15.4303 5.71089Z" fill="currentColor"/>
              </svg>
);

const HighwayFilterIcon = () => (
  <svg className="highway-filter-btn__icon" width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.55965 1.74951V0.999722H10.6683V1.74951C10.6683 2.29936 11.0958 2.74924 11.6183 2.74924H15.4373L14.8673 3.91391C14.796 4.05387 14.7628 4.21383 14.7628 4.36879V13.0214C14.796 13.6212 14.5633 14.5959 13.675 15.4307C12.7916 16.2605 11.2098 16.9903 8.49287 16.9903C5.77591 16.9903 4.19894 16.2605 3.3107 15.4307C2.42246 14.5959 2.18972 13.6212 2.22297 13.0214V13.0064V12.9914V4.36879C2.22297 4.20883 2.18497 4.05387 2.11847 3.91391L1.55323 2.74924H5.60967C6.13216 2.74924 6.55965 2.29936 6.55965 1.74951ZM6.13216 0C5.84241 0 5.60967 0.244932 5.60967 0.549847V1.74951H0L0.356245 2.47931L1.27773 4.37379V12.9864C1.23498 13.8861 1.58173 15.1508 2.68371 16.1855C3.79519 17.2302 5.62392 18 8.49762 18C11.3713 18 13.2001 17.2302 14.3115 16.1855C15.4135 15.1508 15.7603 13.8861 15.7175 12.9864V4.36879L16.6438 2.47931L17 1.74951H11.6278V0.549847C11.6278 0.244932 11.3951 0 11.1053 0H6.14166H6.13216ZM6.00866 6.32824C6.36966 6.32824 6.68315 6.35324 6.95865 6.40322C7.23414 6.45321 7.46214 6.53319 7.64739 6.64815C7.83263 6.75812 7.97038 6.90808 8.06538 7.09303C8.16038 7.27798 8.20788 7.50292 8.20788 7.77784C8.20788 8.10275 8.13663 8.37767 7.99413 8.60261C7.85163 8.82755 7.64264 8.96251 7.37189 9.0125V9.05249C7.50964 9.08248 7.63314 9.12746 7.75189 9.18745C7.87063 9.24743 7.97038 9.32741 8.06063 9.42738C8.15088 9.52736 8.21738 9.65732 8.26963 9.81727C8.32188 9.97223 8.34563 10.1672 8.34563 10.3871C8.34563 10.642 8.29813 10.872 8.20313 11.0769C8.10813 11.2819 7.97513 11.4568 7.80413 11.6018C7.63314 11.7467 7.42414 11.8567 7.17714 11.9317C6.93015 12.0067 6.65465 12.0417 6.35066 12.0417H4.32244V6.33324H6.00866V6.32824ZM6.14166 8.58762C6.47415 8.58762 6.7069 8.53263 6.83515 8.42766C6.9634 8.32269 7.0299 8.15773 7.0299 7.9328C7.0299 7.70786 6.9539 7.5479 6.80665 7.45793C6.6594 7.36296 6.41716 7.31797 6.07991 7.31797H5.47192V8.58762H6.14166ZM5.47192 9.54735V11.0369H6.22241C6.56915 11.0369 6.80665 10.967 6.9444 10.827C7.08215 10.687 7.14864 10.4971 7.14864 10.2621C7.14864 10.0472 7.0774 9.87726 6.93965 9.74729C6.8019 9.61733 6.55015 9.55235 6.18441 9.55235H5.47192V9.54735ZM11.7323 7.25299C11.2906 7.25299 10.9533 7.42794 10.7206 7.77284C10.4878 8.11775 10.3691 8.59261 10.3691 9.19745C10.3691 9.80228 10.4783 10.2771 10.6921 10.6071C10.9058 10.942 11.2526 11.1069 11.7276 11.1069C11.9461 11.1069 12.1646 11.0819 12.3878 11.0269C12.6111 10.972 12.8533 10.897 13.1098 10.802V11.8167C12.8723 11.9167 12.6348 11.9917 12.4021 12.0417C12.1693 12.0916 11.9081 12.1116 11.6183 12.1116C11.0578 12.1116 10.5971 11.9917 10.2361 11.7467C9.8751 11.5018 9.60911 11.1619 9.43811 10.722C9.26711 10.2821 9.18161 9.76729 9.18161 9.18245C9.18161 8.59761 9.28136 8.09775 9.47611 7.65287C9.67561 7.208 9.9606 6.86309 10.3406 6.61316C10.7158 6.36323 11.1813 6.23827 11.7276 6.23827C11.9936 6.23827 12.2643 6.27326 12.5351 6.34824C12.8058 6.41822 13.0671 6.51819 13.3141 6.63816L12.9436 7.62288C12.7393 7.52291 12.5351 7.43294 12.3308 7.35796C12.1266 7.28298 11.9223 7.24799 11.7276 7.24799L11.7323 7.25299Z" fill="currentColor" />
              </svg>
);

const DelayTypeFilterIcon = () => (
  <svg className="delay-type-filter-btn__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.9933 7.00752C10.9933 8.37761 9.16667 10.817 8.36667 11.8195C8.17333 12.0602 7.82 12.0602 7.62667 11.8195C6.82667 10.817 5 8.37761 5 7.00752C5 5.35004 6.34667 4 8 4C9.65333 4 11 5.35004 11 7.00752H10.9933ZM10.2467 7.00752C10.2467 5.76441 9.24 4.74854 7.99333 4.74854C6.74667 4.74854 5.74 5.75773 5.74 7.00752C5.74 7.20134 5.81333 7.50209 5.98 7.90309C6.14667 8.29073 6.38 8.71846 6.64667 9.15288C7.09333 9.87469 7.60667 10.5764 7.99333 11.071C8.38 10.5698 8.89333 9.87469 9.34 9.15288C9.60667 8.71846 9.84 8.29073 10.0067 7.90309C10.1733 7.50209 10.2467 7.20134 10.2467 7.00752ZM6.74667 7.00752C6.74667 6.55973 6.98667 6.14536 7.37333 5.92481C7.76 5.70426 8.23333 5.70426 8.62667 5.92481C9.02 6.14536 9.25333 6.55973 9.25333 7.00752C9.25333 7.45531 9.01333 7.86967 8.62667 8.09023C8.24 8.31078 7.76667 8.31078 7.37333 8.09023C6.98 7.86967 6.74667 7.45531 6.74667 7.00752ZM8.49333 7.00752C8.49333 6.7335 8.26667 6.50627 7.99333 6.50627C7.72 6.50627 7.49333 6.7335 7.49333 7.00752C7.49333 7.28154 7.72 7.50877 7.99333 7.50877C8.26667 7.50877 8.49333 7.28154 8.49333 7.00752Z" fill="currentColor"/>
                <path d="M3.14031 0H3.99491C4.30691 0 4.56465 0.257736 4.56465 0.569733C4.56465 0.881729 4.30691 1.13947 3.99491 1.13947H3.14031C2.03476 1.13947 1.13947 2.03476 1.13947 3.14031V3.99491C1.13947 4.30691 0.881729 4.56465 0.569733 4.56465C0.257736 4.56465 0 4.30691 0 3.99491V3.14031C0 1.40398 1.41077 0 3.14031 0ZM0.569733 5.71089C0.881729 5.71089 1.13947 5.96863 1.13947 6.28063V9.70581C1.13947 10.0178 0.881729 10.2755 0.569733 10.2755C0.257736 10.2755 0 10.0178 0 9.70581V6.28063C0 5.96863 0.257736 5.71089 0.569733 5.71089ZM1.14625 11.9983V12.8529C1.14625 13.9585 2.04154 14.8538 3.1471 14.8538H4.0017C4.31369 14.8538 4.57143 15.1115 4.57143 15.4235C4.57143 15.7355 4.31369 15.9932 4.0017 15.9932H3.1471C1.41077 15.9932 0.00678253 14.5892 0.00678253 12.8529V11.9983C0.00678253 11.6863 0.264519 11.4286 0.576515 11.4286C0.888512 11.4286 1.14625 11.6863 1.14625 11.9983ZM5.71768 0.569733C5.71768 0.257736 5.97541 0 6.28741 0H9.71937C10.0314 0 10.2891 0.257736 10.2891 0.569733C10.2891 0.881729 10.0314 1.13947 9.71937 1.13947H6.28741C5.97541 1.13947 5.71768 0.881729 5.71768 0.569733ZM6.28741 16C5.97541 16 5.71768 15.7423 5.71768 15.4303C5.71768 15.1183 5.97541 14.8605 6.28741 14.8605H9.71937C10.0314 14.8605 10.2891 15.1183 10.2891 15.4303C10.2891 15.7423 10.0314 16 9.71937 16H6.28741ZM15.4303 4.57143C15.1183 4.57143 14.8605 4.31369 14.8605 4.0017V3.1471C14.8605 2.04154 13.9652 1.14625 12.8597 1.14625H12.0051C11.6931 1.14625 11.4354 0.888512 11.4354 0.576515C11.4354 0.264519 11.6931 0.00678253 12.0051 0.00678253H12.8597C14.596 0.00678253 16 1.41077 16 3.1471V4.0017C16 4.31369 15.7423 4.57143 15.4303 4.57143ZM16 11.9983V12.8529C16 14.5892 14.5892 15.9932 12.8597 15.9932H12.0051C11.6931 15.9932 11.4354 15.7355 11.4354 15.4235C11.4354 15.1115 11.6931 14.8538 12.0051 14.8538H12.8597C13.9652 14.8538 14.8605 13.9585 14.8605 12.8529V11.9983C14.8605 11.6863 15.1183 11.4286 15.4303 11.4286C15.7423 11.4286 16 11.6863 16 11.9983ZM15.4303 5.71089C15.7423 5.71089 16 5.96863 16 6.28063V9.70581C16 10.0178 15.7423 10.2755 15.4303 10.2755C15.1183 10.2755 14.8605 10.0178 14.8605 9.70581V6.28063C14.8605 5.96863 15.1183 5.71089 15.4303 5.71089Z" fill="currentColor"/>
              </svg>
);

const SORT_DISPLAY = {
  route_order: 'In order encountered on route',
  severity_desc: 'Severity, Closure to Minor',
  severity_asc: 'Severity, Minor to Closure',
  road_name_asc: 'Road name, A–Z',
  road_name_desc: 'Road name, Z-A',
  last_updated_desc: 'Last updated, New to Old',
  last_updated_asc: 'Last updated, Old to New',
};

function FiltersOverlaySection(props) {
  const { open, onToggle, icon, title, summary = null, children } = props;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <>
      <div
        className={'filters-overlay__subheader bold' + (open ? ' open' : '')}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={handleKeyDown}>
        {icon}
        <p>{title}</p>
        <FontAwesomeIcon className="filters-overlay__subheader-chevron" icon={faChevronDown} />
      </div>
      {summary}
      <div className={'filters-overlay__collapsible' + (open ? ' open' : '')}>
        <div className="filters-overlay__collapsible-inner">
          {children}
        </div>
      </div>
    </>
  );
}

export default function FiltersOverlay(props) {
  const {
    open,
    onClose,
    title = 'Filters',
    showSort = false,
    showDelayTypes = false,
    showAreas = false,
    showHighways = false,
    showFilterSearch = true,
    sortingKey,
    onSortingKeyChange,
    sortingKeys,
    sortedByLabel = null,
    areaObjects,
    highwayCameras,
  } = props;

  const { filterContext, setFilterContext } = useContext(FilterContext);
  const { mapContext, setMapContext } = useContext(MapContext);
  const selectedRoute = useSelector(useCallback(memoize(state => state.routes.selectedRoute), []));
  const routeFound = selectedRoute && selectedRoute.routeFound;

  const [showSortSection, setShowSortSection] = useState(true);
  const [showDelayTypeSection, setShowDelayTypeSection] = useState(true);
  const [showAreaSection, setShowAreaSection] = useState(true);
  const [showHighwaySection, setShowHighwaySection] = useState(true);

  const [pendingAreaFilter, setPendingAreaFilter] = useState(null);
  const [pendingHighwayFilterKey, setPendingHighwayFilterKey] = useState(null);
  const [pendingSortingKey, setPendingSortingKey] = useState(sortingKey);
  const [pendingDelayTypes, setPendingDelayTypes] = useState(
    () => getDelayTypeState(mapContext.visible_layers)
  );
  const [filterOptionsSearch, setFilterOptionsSearch] = useState('');

  // Restage draft filters when opened
  useEffect(() => {
    if (!open) {
      return;
    }

    setPendingAreaFilter(filterContext.areaFilter);
    setPendingHighwayFilterKey(filterContext.highwayFilterKey);
    setPendingSortingKey(sortingKey);
    setPendingDelayTypes(getDelayTypeState(mapContext.visible_layers));
    setFilterOptionsSearch('');
  }, [open]);

  const applyFilters = () => {
    const nextContext = { ...filterContext };
    if (showAreas) {
      nextContext.areaFilter = pendingAreaFilter;
    }
    if (showHighways) {
      nextContext.highwayFilterKey = pendingHighwayFilterKey;
    }
    setFilterContext(nextContext);

    if (showSort && onSortingKeyChange && pendingSortingKey !== sortingKey) {
      onSortingKeyChange(pendingSortingKey);
    }

    if (showDelayTypes) {
      const newMapContext = {
        ...mapContext,
        visible_layers: {
          ...mapContext.visible_layers,
          ...toDelayTypeLayerVisibility(pendingDelayTypes),
        },
      };
      setMapContext(newMapContext);
      localStorage.setItem('mapContext', JSON.stringify(newMapContext));
    }

    setFilterOptionsSearch('');
    onClose();
  };

  const resetDraftFilters = () => {
    if (showAreas) {
      setPendingAreaFilter(null);
    }
    if (showHighways) {
      setPendingHighwayFilterKey(null);
    }
    // First visible sort option (skip route_order when no route)
    if (showSort && sortingKeys?.length) {
      setPendingSortingKey(sortingKeys[routeFound ? 0 : 1]);
    }
    if (showDelayTypes) {
      setPendingDelayTypes({
        closures: true,
        majorEvents: true,
        minorEvents: false,
        futureEvents: false,
        chainUps: false,
      });
    }
    setFilterOptionsSearch('');
  };

  const togglePendingDelayType = (key) => {
    setPendingDelayTypes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const cancelFilters = () => {
    setFilterOptionsSearch('');
    onClose();
  };

  const showSearch = showFilterSearch && (showAreas || showHighways || showDelayTypes);
  const hasPendingFilters = (showAreas && pendingAreaFilter) || (showHighways && pendingHighwayFilterKey);

  const renderSortOptions = () => {
    if (!sortingKeys) {
      return null;
    }

    const options = [];
    for (let i = routeFound ? 0 : 1; i < sortingKeys.length; i++) {
      const key = sortingKeys[i];
      options.push(
        <label key={key} className="sort-row">
          <input
            type="radio"
            name="sort-filter"
            className="sort-row__radio"
            checked={key === pendingSortingKey}
            disabled={routeFound}
            onChange={() => setPendingSortingKey(key)} />
          <span className="sort-row__label">{SORT_DISPLAY[key]}</span>
        </label>
      );
    }
    return options;
  };

  return (
    <div className={`overlay filters-overlay ${open ? 'open' : ''}`}>
      <button
        className="close-overlay"
        aria-label={open ? 'close overlay' : ''}
        aria-labelledby="button-close-overlay"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={cancelFilters}>
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <div className="container--header all-filters">
        <div className="all-filters__row">
          <div className="filters-overlay__icon icon--all-filters">
            <FontAwesomeIcon icon={faSliders} />
          </div>
          <p className="filters-overlay__header bold">{title}</p>
        </div>

        {sortedByLabel &&
          <div className="all-filters__row sorted-by">
            <div className="filters-overlay__icon icon--sorted-by">
              <FontAwesomeIcon icon={faArrowUpArrowDown} />
            </div>
            <p className="filters-overlay__header bold">{sortedByLabel}</p>
          </div>
        }
      </div>

      <div className="filters-component">
        {showSort &&
          <FiltersOverlaySection
            open={showSortSection}
            onToggle={() => setShowSortSection(!showSortSection)}
            icon={<FontAwesomeIcon icon={faArrowUpArrowDown} />}
            title="Sort"
            summary={!showSortSection ? (
              <p className="filters-overlay__selected-sort">{SORT_DISPLAY[pendingSortingKey]}</p>
            ) : null}>
            <div className="sort-filters">
              <div className="sort-options" role="radiogroup" aria-label="Sort">
                {renderSortOptions()}
              </div>
            </div>
          </FiltersOverlaySection>
        }

        {showSort &&
          <div className="filters-overlay__subheader-divider">
            <p className="bold">Filters</p>
            {hasPendingFilters &&
              <Button
                variant="outline-primary"
                className="filter-option-btn reset-filters-btn"
                aria-label="reset all filters"
                onClick={resetDraftFilters}>
                Reset
              </Button>
            }
          </div>
        }

        {showSearch &&
          <FilterOptionsSearch
            value={filterOptionsSearch}
            onChange={setFilterOptionsSearch}
          />
        }

        {showDelayTypes &&
          <FiltersOverlaySection
            open={showDelayTypeSection}
            onToggle={() => setShowDelayTypeSection(!showDelayTypeSection)}
            icon={<DelayTypeFilterIcon />}
            title="Delays type">
            <DelayTypeFilter
              optionsSearch={filterOptionsSearch}
              selectedLayers={pendingDelayTypes}
              onToggleLayer={togglePendingDelayType}
            />
          </FiltersOverlaySection>
        }

        {showAreas &&
          <FiltersOverlaySection
            open={showAreaSection}
            onToggle={() => setShowAreaSection(!showAreaSection)}
            icon={<AreaFilterIcon />}
            title="Areas">
            <AreaFilter
              handleAreaFiltersClose={() => {}}
              objects={areaObjects}
              showAllByDefault={true}
              selectedArea={pendingAreaFilter}
              onSelectArea={setPendingAreaFilter}
              optionsSearch={filterOptionsSearch} />
          </FiltersOverlaySection>
        }

        {showHighways &&
          <FiltersOverlaySection
            open={showHighwaySection}
            onToggle={() => setShowHighwaySection(!showHighwaySection)}
            icon={<HighwayFilterIcon />}
            title="Highways">
            {highwayCameras &&
              <HighwayFilter
                cameras={highwayCameras}
                handleHwyFiltersClose={() => {}}
                showAllByDefault={true}
                selectedHighway={pendingHighwayFilterKey}
                onSelectHighway={setPendingHighwayFilterKey}
                optionsSearch={filterOptionsSearch} />
            }
          </FiltersOverlaySection>
        }
      </div>

      <div className="apply-actions">
        <Button
          variant="primary"
          className="apply-actions__btn apply-actions__btn--apply"
          onClick={applyFilters}>
          Apply
        </Button>
        <Button
          variant="outline-primary"
          className="apply-actions__btn apply-actions__btn--reset"
          onClick={resetDraftFilters}>
          Reset All
        </Button>
        <Button
          variant="outline-primary"
          className="apply-actions__btn apply-actions__btn--cancel"
          onClick={cancelFilters}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
