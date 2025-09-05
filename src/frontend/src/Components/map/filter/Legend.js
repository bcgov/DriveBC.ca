// React
import React from 'react';

// Assets
// Major delays
import closuresStaticIcon from '../../../images/mapIcons/closure-static.png';
import genericDelaysMajorStaticIcon from '../../../images/mapIcons/incident-major-static.png';
import constructionsMajorStaticIcon from '../../../images/mapIcons/delay-major-static.png';
import futureEventsMajorStaticIcon from '../../../images/mapIcons/future-event-major-static.png';

// Minor delays
import genericDelaysStaticIcon from '../../../images/mapIcons/incident-minor-static.png';
import constructionsStaticIcon from '../../../images/mapIcons/delay-minor-static.png';
import futureEventsStaticIcon from '../../../images/mapIcons/future-event-minor-static.png';

// Conditions and features
import cameraIconStatic from '../../../images/mapIcons/camera-static.png';
import roadConditionsStaticIcon from '../../../images/mapIcons/road-condition-static.png';
import wildfiresStaticIcon from '../../../images/mapIcons/wildfire/wildfires-static.png';
import restStopIconStatic from '../../../images/mapIcons/restarea-open-static.png';
import restStopIconStaticClosed from '../../../images/mapIcons/restarea-closed-static.png';
import borderIconStatic from '../../../images/mapIcons/border-static.png';
import advisoriesIcon from '../../../images/legend/advisories.png';
import newlyUpdatedIcon from '../../../images/legend/newly-updated.png';

// Ferries
import coastalFerryIconStatic from '../../../images/mapIcons/coastal-ferry-static.png';
import ferryIconStatic from '../../../images/mapIcons/ferry-static.png';

// Weather
import regionalWeatherIconStatic from '../../../images/mapIcons/regional-weather-static.png';
import regionalWeatherIconAlt from '../../../images/mapIcons/regional-weather-advisory-static.png';
import roadWeatherIconStatic from '../../../images/mapIcons/road-weather-static.png';
import hefIconStatic from '../../../images/mapIcons/elevation-static.png';

// Commercial vehicles
import chainUpsStaticIcon from '../../../images/mapIcons/chain-ups-static.png';
import restStopIconStaticTruck from '../../../images/mapIcons/restarea-truck-open-static.png';
import restStopIconStaticTruckClosed from '../../../images/mapIcons/restarea-truck-closed-static.png';

// Styling
import './Legend.scss';

export default function Legend() {
  // Rendering
  // Sub Components
  const getGroupHeader = (title, description) => {
    return (
      <div className={'legend__group-header'}>
        <div className={'legend__group-header__title'}>{title}</div>

        {description &&
          <div className={'legend__group-header__description'}>{description}</div>
        }
      </div>
    );
  }

  const getLegendItem = (icon, title, description, titleClass) => {
    return (
      <div className={'legend__group__item'}>
        <div className={'legend__group__item__header'}>
          {Array.isArray(icon) ? (
            icon.map((singleIcon, index) => (
              <img
                key={index}
                className={'legend__group__item__header__icon' + (index === 1 ? ' last' : '')}
                src={singleIcon}
                alt={title + ' icon'}
              />
            ))
          ) : (
            <img className={'legend__group__item__header__icon'} src={icon} alt={title + ' icon'} />
          )}

          <div className={'legend__group__item__header__title' + ' ' + titleClass}>{title}</div>
        </div>

        <div className={'legend__group__item__description'}>{description}</div>
      </div>
    );
  };

  // Main Component
  return (
    <div className={'legend'}>
      {getGroupHeader('Major delays', 'Expect delays of 30 minutes or more')}

      <div className={'legend__group'}>
        {getLegendItem(
          closuresStaticIcon,
          'Closures',
          'Travel is not possible in one or both directions on this road. Find an alternate route or detour if possible.',
          'major'
        )}

        {getLegendItem(
          genericDelaysMajorStaticIcon,
          'Incident',
          'An unexpected occurrence on the road that contributes to major delays.',
          'major'
        )}

        {getLegendItem(
          constructionsMajorStaticIcon,
          'Delay',
          'A planned for and expected delay that’s typically part of anticipated road work or construction.',
          'major'
        )}

        {getLegendItem(
          futureEventsMajorStaticIcon,
          'Future event',
          'A planned for and expected event, typically part of anticipated road work or construction, that will occur sometime in the future that will contribute to major delays.',
          'major'
        )}
      </div>

      {getGroupHeader('Minor delays', 'Expect delays of 30 minutes or less')}

      <div className={'legend__group'}>
        {getLegendItem(
          genericDelaysStaticIcon,
          'Incident',
          'An unexpected occurrence on the road that contributes to minor delays',
          'minor'
        )}

        {getLegendItem(
          constructionsStaticIcon,
          'Delay',
          'A planned for and expected delay that’s typically part of anticipated road work or construction.',
          'minor'
        )}

        {getLegendItem(
          futureEventsStaticIcon,
          'Future event',
          'A planned for and expected event, typically part of anticipated road work or construction, that will occur sometime in the future and could contribute to minor delays.',
          'minor'
        )}
      </div>

      {getGroupHeader('Conditions and features', null)}

      <div className={'legend__group'}>
        {getLegendItem(
          cameraIconStatic,
          'Highway cameras',
          'Look at recent pictures from cameras located close to the highway.',
          'general'
        )}

        {getLegendItem(
          roadConditionsStaticIcon,
          'Road conditions',
          'States of the road that may impact drivability.',
          'minor'
        )}

        {getLegendItem(
          wildfiresStaticIcon,
          'Wildfires',
          'Active forest fires that may impact drivability and are near a road or population area.',
          'major'
        )}

        {getLegendItem(
          [restStopIconStatic, restStopIconStaticClosed],
          'Provincial rest areas',
          'Locations of rest stops maintained by the province. Closed rest stops are displayed in red.',
          'rest-stop'
        )}

        {getLegendItem(
          borderIconStatic,
          'Border crossing',
          'Locations of border crossings with estimated delays in either direction.',
          'general'
        )}

        {getLegendItem(
          advisoriesIcon,
          'Advisories',
          'Indicates there is critical information that impacts travel through the highway or region.',
          'advisories'
        )}

        {getLegendItem(
          newlyUpdatedIcon,
          'Newly updated',
          'Icons with dots indicate there has been an update since the page was loaded.',
          'newly-updated'
        )}
      </div>

      {getGroupHeader('Ferries', null)}

      <div className={'legend__group'}>
        {getLegendItem(
          ferryIconStatic,
          'Inland ferries',
          'Travel that requires use of an inland ferry.',
          'ferries'
        )}
        {getLegendItem(
          coastalFerryIconStatic,
          'Coastal ferries',
          'Travel that requires use of a coastal ferry.',
          'ferries'
        )}
      </div>

      {getGroupHeader('Weather', null)}

      <div className={'legend__group'}>
        {getLegendItem(
          [regionalWeatherIconStatic, regionalWeatherIconAlt],
          'Regional',
          'Current conditions and forecast from Environment Canada, typically near a city or park. When Environment Canada has issued a weather advisory, the icon is displayed in gold.',
          'weather'
        )}

        {getLegendItem(
          roadWeatherIconStatic,
          'Local',
          'Weather data from weather stations that collect data on weather and (if beside road) pavement conditions from strategic locations across the province.',
          'weather'
        )}

        {getLegendItem(
          hefIconStatic,
          'High elevation',
          'A special weather forecast, provided by Environment Canada, specifically for high mountain passes that can experience drastic changes in weather compared to the surrounding areas.  ',
          'weather'
        )}
      </div>

      {getGroupHeader('Commercial vehicles', null)}

      <div className={'legend__group'}>
        {getLegendItem(
          chainUpsStaticIcon,
          'Chain-ups in effect',
          'Segments of the highway that require commercial vehicles over 11,794 kg to have chains on in order to use the highway.',
          'chain-up'
        )}

        {getLegendItem(
          [restStopIconStaticTruck, restStopIconStaticTruckClosed],
          'Large vehicle rest stops',
          'Locations of rest stops maintained by the province that can accommodate large vehicles greater than 20 metres (66 feet) in length. Closed rest stops are displayed in red.',
          'rest-stop'
        )}
      </div>
    </div>
  );
}
