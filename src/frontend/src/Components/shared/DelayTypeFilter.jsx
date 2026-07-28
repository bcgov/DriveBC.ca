// React
import React from 'react';

// Internal imports
import trackEvent from './TrackEvent';

// Styling
import './DelayTypeFilter.scss';

export const DELAY_TYPES = [
  {
    key: 'closures',
    lineKey: 'closuresLines',
    label: 'Closures',
    trackLabel: 'Toggle closures layer',
  },
  {
    key: 'majorEvents',
    lineKey: 'majorEventsLines',
    label: 'Major delays',
    trackLabel: 'Toggle major events layer',
  },
  {
    key: 'minorEvents',
    lineKey: 'minorEventsLines',
    label: 'Minor delays',
    trackLabel: 'Toggle minor events layer',
  },
  {
    key: 'futureEvents',
    lineKey: 'futureEventsLines',
    label: 'Future events',
    trackLabel: 'Toggle future events layer',
  },
  {
    key: 'chainUps',
    lineKey: 'chainUpsLines',
    label: 'Chain-ups',
    trackLabel: 'Toggle chain ups layer',
  },
];

export const getDelayTypeState = (visibleLayers = {}) => (
  DELAY_TYPES.reduce((state, delayType) => {
    state[delayType.key] = !!visibleLayers[delayType.key];
    return state;
  }, {})
);

export const toDelayTypeLayerVisibility = (delayTypeState = {}) => (
  DELAY_TYPES.reduce((layers, delayType) => {
    const enabled = !!delayTypeState[delayType.key];
    layers[delayType.key] = enabled;
    layers[delayType.lineKey] = enabled;
    return layers;
  }, {})
);

export default function DelayTypeFilter(props) {
  const { optionsSearch = '', selectedLayers, onToggleLayer } = props;

  const focusInput = (filter) => {
    filter.focus();
    setTimeout(() => {
      filter.blur();
    }, 1000);
  };

  const toggleLayer = (delayType, e) => {
    trackEvent('click', 'map', delayType.trackLabel);
    onToggleLayer(delayType.key);
    if (e) {
      focusInput(e.target);
    }
  };

  const searchTerm = optionsSearch.trim().toLowerCase();
  const visibleTypes = DELAY_TYPES.filter(
    (delayType) => !searchTerm || delayType.label.toLowerCase().includes(searchTerm)
  );

  return (
    <div className="delay-type-filters">
      <div className="delay-type-options" role="group" aria-label="Delay types">
        {visibleTypes.map((delayType) => {
          const checked = !!selectedLayers?.[delayType.key];
          const inputId = `delay-type-filter--${delayType.key}`;

          return (
            <label
              key={delayType.key}
              className={'delay-type-row' + (checked ? ' checked' : '')}
              htmlFor={inputId}>
              <input
                type="checkbox"
                id={inputId}
                className="delay-type-row__checkbox"
                checked={checked}
                onChange={(e) => toggleLayer(delayType, e)}
              />
              <span className="delay-type-row__text">{delayType.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
