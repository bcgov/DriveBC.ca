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
import futureEventsMajorActiveIcon from '../images/mapIcons/future-event-major-active.png';
import futureEventsMajorStaticIcon from '../images/mapIcons/future-event-major-static.png';
import futureEventsActiveIcon from '../images/mapIcons/future-event-minor-active.png';
import futureEventsStaticIcon from '../images/mapIcons/future-event-minor-static.png';

// Road Conditions
import roadConditionsActiveIcon from '../images/mapIcons/road-condition-active.png';
import roadConditionsStaticIcon from '../images/mapIcons/road-condition-static.png';

// Constructions
import constructionsMajorActiveIcon from '../images/mapIcons/delay-major-active.png';
import constructionsMajorStaticIcon from '../images/mapIcons/delay-major-static.png';
import constructionsActiveIcon from '../images/mapIcons/delay-minor-active.png';
import constructionsStaticIcon from '../images/mapIcons/delay-minor-static.png';

// Generic Events
import genericDelaysMajorActiveIcon from '../images/mapIcons/incident-major-active.png';
import genericDelaysMajorStaticIcon from '../images/mapIcons/incident-major-static.png';
import genericDelaysActiveIcon from '../images/mapIcons/incident-minor-active.png';
import genericDelaysStaticIcon from '../images/mapIcons/incident-minor-static.png';

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
      if (state === 'active')
        return <img className={'delay-icon-img'} src={roadConditionsActiveIcon } />
      else
        return <img className={'delay-icon-img'} src={roadConditionsStaticIcon } />
    }
  }
}
