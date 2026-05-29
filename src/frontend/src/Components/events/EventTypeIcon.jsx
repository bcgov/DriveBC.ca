// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChainHorizontal
} from '@fortawesome/pro-solid-svg-icons';


// Events
// Closures
import closuresActiveIcon from '../../images/mapIcons/closure-active.png';
import closuresActiveAltIcon from '../../images/mapIcons/closure-alt-active.png';
import closuresStaticIcon from '../../images/mapIcons/closure-static.png';

// Future Closures
import futureClosureActiveIcon from '../../images/mapIcons/future-closure-active.png';
import futureClosureStaticIcon from '../../images/mapIcons/future-closure-static.png';

// Future Events
import futureEventsMajorActiveIcon from '../../images/mapIcons/future-event-major-active.png';
import futureEventsMajorStaticIcon from '../../images/mapIcons/future-event-major-static.png';
import futureEventsActiveIcon from '../../images/mapIcons/future-event-minor-active.png';
import futureEventsStaticIcon from '../../images/mapIcons/future-event-minor-static.png';

// Road Conditions
import roadConditionsActiveIcon from '../../images/mapIcons/road-condition-active.png';
import roadConditionsStaticIcon from '../../images/mapIcons/road-condition-static.png';

// Chain Ups
import chainUpsActiveIcon from '../../images/mapIcons/chain-ups-active.png';

// Constructions
import constructionsMajorActiveIcon from '../../images/mapIcons/delay-major-active.png';
import constructionsMajorStaticIcon from '../../images/mapIcons/delay-major-static.png';
import constructionsActiveIcon from '../../images/mapIcons/delay-minor-active.png';
import constructionsStaticIcon from '../../images/mapIcons/delay-minor-static.png';

// Generic Events
import genericDelaysMajorActiveIcon from '../../images/mapIcons/incident-major-active.png';
import genericDelaysMajorStaticIcon from '../../images/mapIcons/incident-major-static.png';
import genericDelaysActiveIcon from '../../images/mapIcons/incident-minor-active.png';
import genericDelaysStaticIcon from '../../images/mapIcons/incident-minor-static.png';
import { getTypeDisplay } from './functions';

export default function EventTypeIcon(props) {
  const { event, state, alt = false } = props;
  const { display_category, event_type, severity } = event;

  switch (display_category) {
    case "closures":
      return <img className={'delay-icon-img'} src={state === 'active' ? alt ? closuresActiveAltIcon : closuresActiveIcon : closuresStaticIcon} alt={getTypeDisplay(event)} aria-hidden={true} />

    case "majorEvents": {
      if (state === 'active')
        return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsMajorActiveIcon : genericDelaysMajorActiveIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
      else
        return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsMajorStaticIcon : genericDelaysMajorStaticIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
    }

    case "minorEvents": {
      if (state === 'active')
        return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsActiveIcon : genericDelaysActiveIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
      else
        return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsStaticIcon : genericDelaysStaticIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
    }
    case "futureEvents": {
      switch (severity) {
        case "CLOSURE": {
          if (state === 'active')
            return <img className={'delay-icon-img'} src={futureClosureActiveIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
          else
            return <img className={'delay-icon-img'} src={futureClosureStaticIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
        }
        case "MAJOR": {
          if (state === 'active')
            return <img className={'delay-icon-img'} src={futureEventsMajorActiveIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
          else
            return <img className={'delay-icon-img'} src={futureEventsMajorStaticIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
        }
        default: {
          if (state === 'active')
            return <img className={'delay-icon-img'} src={futureEventsActiveIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
          else
            return <img className={'delay-icon-img'} src={futureEventsStaticIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
        }
      }
    }

    case "roadConditions": {
      if (state === 'active')
        return <img className={'delay-icon-img'} src={roadConditionsActiveIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
      else
        return <img className={'delay-icon-img'} src={roadConditionsStaticIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
    }

    case "chainUps": {
      if (state === 'active')
        return <img className={'delay-icon-img'} src={chainUpsActiveIcon } alt={getTypeDisplay(event)} aria-hidden={true}/>
      else
        return <div className="delay-icon-img"><FontAwesomeIcon icon={faChainHorizontal} alt={getTypeDisplay(event)} aria-hidden={true} /></div>
    }
  }
}
