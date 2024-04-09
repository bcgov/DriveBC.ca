import { Fill, Icon, Stroke, Style } from 'ol/style.js';

// Static assets
// Cameras
import cameraIconActive from '../../images/mapIcons/camera-active.png';
import cameraIconHover from '../../images/mapIcons/camera-hover.png';
import cameraIconStatic from '../../images/mapIcons/camera-static.png';

// Ferries
import ferryIconActive from '../../images/mapIcons/ferry-active.png';
import ferryIconHover from '../../images/mapIcons/ferry-hover.png';
import ferryIconStatic from '../../images/mapIcons/ferry-static.png';

// Road Weather
import roadWeatherIconActive from '../../images/mapIcons/road-weather-active.png';
import roadWeatherIconHover from '../../images/mapIcons/road-weather-hover.png';
import roadWeatherIconStatic from '../../images/mapIcons/road-weather-static.png';

// Regional Weather
import regionalWeatherIconActive from '../../images/mapIcons/regional-weather-active.png';
import regionalWeatherIconHover from '../../images/mapIcons/regional-weather-hover.png';
import regionalWeatherIconStatic from '../../images/mapIcons/regional-weather-static.png';

// Rest Stops
import restStopIconActive from '../../images/mapIcons/restarea-open-active.png';
import restStopIconHover from '../../images/mapIcons/restarea-open-hover.png';
import restStopIconStatic from '../../images/mapIcons/restarea-open-static.png';

import restStopIconActiveClosed from '../../images/mapIcons/restarea-closed-active.png';
import restStopIconHoverClosed from '../../images/mapIcons/restarea-closed-hover.png';
import restStopIconStaticClosed from '../../images/mapIcons/restarea-closed-static.png';

import restStopIconActiveTruck from '../../images/mapIcons/restarea-truck-open-active.png';
import restStopIconHoverTruck from '../../images/mapIcons/restarea-truck-open-hover.png';
import restStopIconStaticTruck from '../../images/mapIcons/restarea-truck-open-static.png';

import restStopIconActiveTruckClosed from '../../images/mapIcons/restarea-truck-closed-active.png';
import restStopIconHoverTruckClosed from '../../images/mapIcons/restarea-truck-closed-hover.png';
import restStopIconStaticTruckClosed from '../../images/mapIcons/restarea-truck-closed-static.png';

// Events
// Closures
import closuresActiveIcon from '../../images/mapIcons/closure-active.png';
import closuresHoverIcon from '../../images/mapIcons/closure-hover.png';
import closuresStaticIcon from '../../images/mapIcons/closure-static.png';

// Future Events
import futureEventsMajorActiveIcon from '../../images/mapIcons/future-event-major-active.png';
import futureEventsMajorHoverIcon from '../../images/mapIcons/future-event-major-hover.png';
import futureEventsMajorStaticIcon from '../../images/mapIcons/future-event-major-static.png';
import futureEventsActiveIcon from '../../images/mapIcons/future-event-minor-active.png';
import futureEventsHoverIcon from '../../images/mapIcons/future-event-minor-hover.png';
import futureEventsStaticIcon from '../../images/mapIcons/future-event-minor-static.png';

// Road Conditions
import roadConditionsActiveIcon from '../../images/mapIcons/road-condition-active.png';
import roadConditionsHoverIcon from '../../images/mapIcons/road-condition-hover.png';
import roadConditionsStaticIcon from '../../images/mapIcons/road-condition-static.png';

// Constructions
import constructionsMajorActiveIcon from '../../images/mapIcons/delay-major-active.png';
import constructionsMajorHoverIcon from '../../images/mapIcons/delay-major-hover.png';
import constructionsMajorStaticIcon from '../../images/mapIcons/delay-major-static.png';
import constructionsActiveIcon from '../../images/mapIcons/delay-minor-active.png';
import constructionsHoverIcon from '../../images/mapIcons/delay-minor-hover.png';
import constructionsStaticIcon from '../../images/mapIcons/delay-minor-static.png';

// Generic Events
import genericDelaysMajorActiveIcon from '../../images/mapIcons/incident-major-active.png';
import genericDelaysMajorHoverIcon from '../../images/mapIcons/incident-major-hover.png';
import genericDelaysMajorStaticIcon from '../../images/mapIcons/incident-major-static.png';
import genericDelaysActiveIcon from '../../images/mapIcons/incident-minor-active.png';
import genericDelaysHoverIcon from '../../images/mapIcons/incident-minor-hover.png';
import genericDelaysStaticIcon from '../../images/mapIcons/incident-minor-static.png';

// Map advisory styles
export const advisoryStyles = {
  polygon: new Style({
    stroke: new Stroke({
      color: 'rgb(88, 66, 21)',
      width: 2,
      lineDash: [10,10]
    }),
    fill: new Fill({
      color: 'rgba(252, 186, 25, 0.25)',
    }),
  })
};

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

// Weather icon styles
export const roadWeatherStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: roadWeatherIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: roadWeatherIconHover,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: roadWeatherIconActive,
    }),
  }),
};

// Regional weather icon styles
export const regionalStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: regionalWeatherIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: regionalWeatherIconHover,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: regionalWeatherIconActive,
    }),
  }),
};

// Rest Stop icon styles
export const restStopStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconHover,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconActive,
    }),
  }),
};

export const restStopTruckStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconStaticTruck,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconHoverTruck,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconActiveTruck,
    }),
  }),
};

export const restStopClosedStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconStaticClosed,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconHoverClosed,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconActiveClosed,
    }),
  }),
};

export const restStopTruckClosedStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconStaticTruckClosed,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconHoverTruckClosed,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconActiveTruckClosed,
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
