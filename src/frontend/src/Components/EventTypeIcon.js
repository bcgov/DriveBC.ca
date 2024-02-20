// React
import React from 'react';

// Third Party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faSnowflake,
  faMinusCircle,
} from "@fortawesome/free-solid-svg-icons";

// Events
// Closures
import closuresActiveIcon from '../images/mapIcons/closure-active.png';
import closuresStaticIcon from '../images/mapIcons/closure-static.png';

// Future Events
import futureEventsMajorActiveIcon from '../images/mapIcons/futureevent-major-active.png';
import futureEventsMajorStaticIcon from '../images/mapIcons/futureevent-major-static.png';
import futureEventsActiveIcon from '../images/mapIcons/futureevent-minor-active.png';
import futureEventsStaticIcon from '../images/mapIcons/futureevent-minor-static.png';

// Road Conditions
import roadConditionsMajorStaticIcon from '../images/mapIcons/road-major-static.png';
import roadConditionsStaticIcon from '../images/mapIcons/road-minor-static.png';

// Constructions
import constructionsMajorActiveIcon from '../images/mapIcons/construction-major-active.png';
import constructionsMajorStaticIcon from '../images/mapIcons/construction-major-static.png';
import constructionsActiveIcon from '../images/mapIcons/construction-minor-active.png';
import constructionsStaticIcon from '../images/mapIcons/construction-minor-static.png';

// Generic Events
import genericDelaysMajorActiveIcon from '../images/mapIcons/generic-event-major-active.png';
import genericDelaysMajorStaticIcon from '../images/mapIcons/generic-event-major-static.png';
import genericDelaysActiveIcon from '../images/mapIcons/generic-event-minor-active.png';
import genericDelaysStaticIcon from '../images/mapIcons/generic-event-minor-static.png';

export default function EventTypeIcon(props) {
  const { event, state } = props;
  const { display_category, event_type, severity } = event;

  switch (display_category) {
    case "closures":
      return <img className={'delay-icon-img'} src={state === 'active' ? closuresActiveIcon : closuresStaticIcon} />

    case "majorEvents": {
      if (state === 'active')
        return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsMajorActiveIcon : genericDelaysMajorActiveIcon } />
      else
        return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsMajorStaticIcon : genericDelaysMajorStaticIcon } />
    }

    case "minorEvents": {
      if (state === 'active')
        return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsActiveIcon : genericDelaysActiveIcon } />
      else
        return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsStaticIcon : genericDelaysStaticIcon } />
    }

    case "futureEvents": {
      if (state === 'active')
        return <img className={'delay-icon-img'} src={severity === 'MAJOR' ? futureEventsMajorActiveIcon : futureEventsActiveIcon } />
      else
        return <img className={'delay-icon-img'} src={severity === 'MAJOR' ? futureEventsMajorStaticIcon : futureEventsStaticIcon } />
    }

    case "roadConditions": {
      return <img className={'delay-icon-img'} src={severity === 'MAJOR' ? roadConditionsMajorStaticIcon : roadConditionsStaticIcon } />
    }
  }
}
