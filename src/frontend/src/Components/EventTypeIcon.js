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
import closuresStaticIcon from '../images/mapIcons/closure-static.png';

// Future Events
import futureEventsMajorStaticIcon from '../images/mapIcons/futureevent-major-static.png';
import futureEventsStaticIcon from '../images/mapIcons/futureevent-minor-static.png';

// Road Conditions
import roadConditionsMajorStaticIcon from '../images/mapIcons/road-major-static.png';
import roadConditionsStaticIcon from '../images/mapIcons/road-minor-static.png';

// Constructions
import constructionsMajorStaticIcon from '../images/mapIcons/construction-major-static.png';
import constructionsStaticIcon from '../images/mapIcons/construction-minor-static.png';

// Generic Events
import genericDelaysMajorStaticIcon from '../images/mapIcons/generic-event-major-static.png';
import genericDelaysStaticIcon from '../images/mapIcons/generic-event-minor-static.png';

export default function EventTypeIcon(props) {
  const { event } = props;
  const { display_category, event_type, severity } = event;

  switch (display_category) {
    case "closures":
      return <img className={'delay-icon-img'} src={closuresStaticIcon} />

    case "majorEvents": {
      return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsMajorStaticIcon : genericDelaysMajorStaticIcon } />
    }

    case "minorEvents": {
      return <img className={'delay-icon-img'} src={event_type === 'CONSTRUCTION' ? constructionsStaticIcon : genericDelaysStaticIcon } />
    }

    case "futureEvents": {
      return <img className={'delay-icon-img'} src={severity === 'MAJOR' ? futureEventsMajorStaticIcon : futureEventsStaticIcon } />
    }

    case "roadConditions": {
      return <img className={'delay-icon-img'} src={severity === 'MAJOR' ? roadConditionsMajorStaticIcon : roadConditionsStaticIcon } />
    }
  }
}
