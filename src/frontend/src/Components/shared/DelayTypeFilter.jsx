// React
import React from 'react';

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

export const RESET_DELAY_TYPE_STATE = {
  closures: true,
  majorEvents: true,
  minorEvents: false,
  futureEvents: false,
  chainUps: false,
};

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

export function DelayTypeIcon({ typeKey }) {
  switch (typeKey) {
    case 'minorEvents':
      return (
        <svg className="delays-filter-btn__icon" width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M5.5 7.64307C5.1693 7.64307 5.00525 7.50778 4.96875 7.44971L1.02149 1.16943C1.08212 1.10753 1.24354 1.00056 1.5293 1.00049L9.4707 1.00049C9.75722 1.00056 9.91924 1.1076 9.97949 1.16943L6.03125 7.44971C5.99475 7.50778 5.8307 7.64307 5.5 7.64307Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    case 'majorEvents':
      return (
        <svg className="delays-filter-btn__icon" width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="1.41421" y="6.36396" width="7" height="7" rx="1" transform="rotate(-45 1.41421 6.36396)" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    case 'futureEvents':
      return (
        <svg className="delays-filter-btn__icon" width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M3.26562 0.515625V1.375H6.35938V0.515625C6.35938 0.236328 6.57422 0 6.875 0C7.1543 0 7.39062 0.236328 7.39062 0.515625V1.375H8.25C9.00195 1.375 9.625 1.99805 9.625 2.75V3.09375V4.125V9.625C9.625 10.3984 9.00195 11 8.25 11H1.375C0.601562 11 0 10.3984 0 9.625V4.125V3.09375V2.75C0 1.99805 0.601562 1.375 1.375 1.375H2.23438V0.515625C2.23438 0.236328 2.44922 0 2.75 0C3.0293 0 3.26562 0.236328 3.26562 0.515625ZM1.03125 4.125V5.32812H2.75V4.125H1.03125ZM1.03125 6.35938V7.73438H2.75V6.35938H1.03125ZM3.78125 6.35938V7.73438H5.84375V6.35938H3.78125ZM6.875 6.35938V7.73438H8.59375V6.35938H6.875ZM8.59375 5.32812V4.125H6.875V5.32812H8.59375ZM8.59375 8.76562H6.875V9.96875H8.25C8.42188 9.96875 8.59375 9.81836 8.59375 9.625V8.76562ZM5.84375 8.76562H3.78125V9.96875H5.84375V8.76562ZM2.75 8.76562H1.03125V9.625C1.03125 9.81836 1.18164 9.96875 1.375 9.96875H2.75V8.76562ZM5.84375 5.32812V4.125H3.78125V5.32812H5.84375Z" fill="currentColor"/>
        </svg>
      );
    case 'chainUps':
      return (
        <svg className="delays-filter-btn__icon" width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12.3965 5.58594L9.96875 8.01367C8.74414 9.2168 6.78906 9.2168 5.58594 8.01367C4.44727 6.85352 4.38281 5.02734 5.43555 3.80273L5.54297 3.67383C5.73633 3.45898 6.05859 3.4375 6.27344 3.63086C6.48828 3.82422 6.50977 4.14648 6.31641 4.36133L6.23047 4.46875C5.5 5.28516 5.54297 6.50977 6.31641 7.2832C7.11133 8.07812 8.42188 8.07812 9.23828 7.2832L11.666 4.85547C12.4609 4.03906 12.4609 2.75 11.666 1.93359C10.8926 1.18164 9.66797 1.13867 8.85156 1.84766L8.72266 1.95508C8.50781 2.14844 8.18555 2.12695 7.99219 1.91211C7.79883 1.69727 7.82031 1.375 8.03516 1.18164L8.16406 1.07422C9.38867 0 11.2363 0.0644531 12.3965 1.20312C13.5996 2.40625 13.5996 4.36133 12.3965 5.58594ZM1.20312 5.0918L3.65234 2.66406C4.85547 1.46094 6.81055 1.46094 8.01367 2.66406C9.17383 3.80273 9.23828 5.65039 8.16406 6.875L8.03516 7.00391C7.86328 7.21875 7.51953 7.26172 7.30469 7.06836C7.08984 6.875 7.06836 6.55273 7.26172 6.33789L7.39062 6.20898C8.09961 5.39258 8.05664 4.16797 7.2832 3.39453C6.48828 2.57812 5.17773 2.57812 4.38281 3.39453L1.93359 5.82227C1.13867 6.61719 1.13867 7.92773 1.93359 8.74414C2.70703 9.49609 3.93164 9.53906 4.74805 8.83008L4.87695 8.72266C5.0918 8.5293 5.41406 8.55078 5.60742 8.76562C5.80078 8.98047 5.7793 9.30273 5.56445 9.49609L5.43555 9.60352C4.21094 10.6777 2.36328 10.6133 1.20312 9.47461C0 8.27148 0 6.29492 1.20312 5.0918Z" fill="currentColor"/>
        </svg>
      );
    case 'closures':
      return (
        <svg className="delays-filter-btn__icon" width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M9.96875 5.73633C9.96875 4.14648 9.10938 2.68555 7.73438 1.86914C6.33789 1.07422 4.64062 1.07422 3.26562 1.86914C1.86914 2.68555 1.03125 4.14648 1.03125 5.73633C1.03125 7.34766 1.86914 8.80859 3.26562 9.625C4.64062 10.4199 6.33789 10.4199 7.73438 9.625C9.10938 8.80859 9.96875 7.34766 9.96875 5.73633ZM0 5.73633C0 3.78125 1.03125 1.97656 2.75 0.988281C4.44727 0 6.53125 0 8.25 0.988281C9.94727 1.97656 11 3.78125 11 5.73633C11 7.71289 9.94727 9.51758 8.25 10.5059C6.53125 11.4941 4.44727 11.4941 2.75 10.5059C1.03125 9.51758 0 7.71289 0 5.73633ZM2.75 4.70508H8.25C8.61523 4.70508 8.9375 5.02734 8.9375 5.39258V6.08008C8.9375 6.4668 8.61523 6.76758 8.25 6.76758H2.75C2.36328 6.76758 2.0625 6.4668 2.0625 6.08008V5.39258C2.0625 5.02734 2.36328 4.70508 2.75 4.70508Z" fill="currentColor"/>
        </svg>
      );
    default:
      return null;
  }
}

export default function DelayTypeFilter(props) {
  const { optionsSearch = '', selectedLayers, onToggleLayer } = props;

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
                onChange={() => onToggleLayer(delayType.key)}
              />
              <span className="delay-type-row__text">{delayType.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
