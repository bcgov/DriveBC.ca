import { Icon, Stroke, Style } from 'ol/style.js';

// Static assets
// Cameras
import cameraIconActive from '../../images/mapIcons/camera-active.png';
import cameraIconHover from '../../images/mapIcons/camera-hover.png';
import cameraIconStatic from '../../images/mapIcons/camera-static.png';

// Ferries
import ferryIconActive from '../../images/mapIcons/ferry-active.png';
import ferryIconHover from '../../images/mapIcons/ferry-hover.png';
import ferryIconStatic from '../../images/mapIcons/ferry-static.png';

// Events
// Closures
import closuresActiveIcon from '../../images/mapIcons/closure-active.png';
import closuresHoverIcon from '../../images/mapIcons/closure-hover.png';
import closuresStaticIcon from '../../images/mapIcons/closure-static.png';

// Future Events
import futureEventsMajorActiveIcon from '../../images/mapIcons/futureevent-major-active.png';
import futureEventsMajorHoverIcon from '../../images/mapIcons/futureevent-major-hover.png';
import futureEventsMajorStaticIcon from '../../images/mapIcons/futureevent-major-static.png';
import futureEventsActiveIcon from '../../images/mapIcons/futureevent-minor-active.png';
import futureEventsHoverIcon from '../../images/mapIcons/futureevent-minor-hover.png';
import futureEventsStaticIcon from '../../images/mapIcons/futureevent-minor-static.png';

// Road Conditions
import roadConditionsMajorActiveIcon from '../../images/mapIcons/road-major-active.png';
import roadConditionsMajorHoverIcon from '../../images/mapIcons/road-major-hover.png';
import roadConditionsMajorStaticIcon from '../../images/mapIcons/road-major-static.png';
import roadConditionsActiveIcon from '../../images/mapIcons/road-minor-active.png';
import roadConditionsHoverIcon from '../../images/mapIcons/road-minor-hover.png';
import roadConditionsStaticIcon from '../../images/mapIcons/road-minor-static.png';

// Constructions
import constructionsMajorActiveIcon from '../../images/mapIcons/currentevent-major-active.png';
import constructionsMajorHoverIcon from '../../images/mapIcons/currentevent-major-hover.png';
import constructionsMajorStaticIcon from '../../images/mapIcons/currentevent-major-static.png';
import constructionsActiveIcon from '../../images/mapIcons/currentevent-minor-active.png';
import constructionsHoverIcon from '../../images/mapIcons/currentevent-minor-hover.png';
import constructionsStaticIcon from '../../images/mapIcons/currentevent-minor-static.png';

// Generic Events
import genericDelaysMajorActiveIcon from '../../images/mapIcons/generic-event-major-active.png';
import genericDelaysMajorHoverIcon from '../../images/mapIcons/generic-event-major-hover.png';
import genericDelaysMajorStaticIcon from '../../images/mapIcons/generic-event-major-static.png';
import genericDelaysActiveIcon from '../../images/mapIcons/generic-event-minor-active.png';
import genericDelaysHoverIcon from '../../images/mapIcons/generic-event-minor-hover.png';
import genericDelaysStaticIcon from '../../images/mapIcons/generic-event-minor-static.png';

// Camera icon styles
export const cameraStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: cameraIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: cameraIconHover,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: cameraIconActive,
    }),
  }),
};

// Ferry icon styles
export const ferryStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: ferryIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: ferryIconHover,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: ferryIconActive,
    }),
  }),
};

// Event icon styles
export const eventStyles = {
  // Line Segments
  segments: {
    static: new Style({
      stroke: new Stroke({
        color: 'rgba(144 ,164 ,190, 0.5)',
        width: 8,
      }),
    }),
    hover: new Style({
      stroke: new Stroke({
        color: 'rgba(232 ,192 ,97, 0.75)',
        width: 10,
      }),
    }),
    active: new Style({
      stroke: new Stroke({
        color: 'rgba(252 ,186 ,25, 0.9)',
        width: 10,
      }),
    })
  },

  // Closures
  closures: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: closuresStaticIcon,
      }),
    }),
    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: closuresHoverIcon,
      }),
    }),
    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: closuresActiveIcon,
      }),
    }),
  },

  // Future events
  major_future_events: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsMajorStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsMajorHoverIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsMajorActiveIcon,
      }),
    }),
  },

  future_events: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsHoverIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsActiveIcon,
      }),
    }),
  },

  // Road Conditions
  major_road_conditions: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsMajorStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsMajorHoverIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsMajorActiveIcon,
      }),
    }),
  },

  road_conditions: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsHoverIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsActiveIcon,
      }),
    }),
  },

  // Constructions
  major_constructions: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsMajorStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsMajorHoverIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsMajorActiveIcon,
      }),
    }),
  },

  constructions: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsHoverIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsActiveIcon,
      }),
    }),
  },

  // Generic delay
  major_generic_delays: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysMajorStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysMajorHoverIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysMajorActiveIcon,
      }),
    }),
  },

  generic_delays: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysHoverIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysActiveIcon,
      }),
    }),
  }
};
