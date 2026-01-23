import { Fill, Icon, Stroke, Style } from 'ol/style.js';

// Static assets
// Cameras
import cameraIconStatic from '../../images/mapIcons/camera-static.png';
import cameraIconActive from '../../images/mapIcons/camera-active.png';

// Ferries
import ferryIconStatic from '../../images/mapIcons/ferry-static.png';

// Coastal Ferries
import coastalFerryIconStatic from '../../images/mapIcons/coastal-ferry-static.png';

// Road Weather
import roadWeatherIconStatic from '../../images/mapIcons/road-weather-static.png';

// Regional Weather
import regionalWeatherIconStatic from '../../images/mapIcons/regional-weather-static.png';

// Regional Weather with warning
import regionalWeatherWarningIconStatic from '../../images/mapIcons/regional-weather-advisory-static.png';

// High Elevation Forecast
import hefIconStatic from '../../images/mapIcons/elevation-static.png';

// High Elevation Forecast with warning
import hefIconWarningStatic from '../../images/mapIcons/elevation-advisory-static.png';

// Border Crossings
import borderIconStatic from '../../images/mapIcons/border-static.png';

// Wildfires
import wildfireIconStatic from '../../images/mapIcons/wildfire/wildfires-static.png';

// Rest Stops
import restStopIconStatic from '../../images/mapIcons/restarea-open-static.png';

import restStopIconStaticClosed from '../../images/mapIcons/restarea-closed-static.png';

import restStopIconStaticTruck from '../../images/mapIcons/restarea-truck-open-static.png';

import restStopIconStaticTruckClosed from '../../images/mapIcons/restarea-truck-closed-static.png';

// Events
// Closures
import closuresStaticIcon from '../../images/mapIcons/closure-static.png';
import futureClosureStaticIcon from '../../images/mapIcons/future-closure-static.png';

// Future Events
import futureEventsMajorStaticIcon from '../../images/mapIcons/future-event-major-static.png';
import futureEventsStaticIcon from '../../images/mapIcons/future-event-minor-static.png';

// Road Conditions
import roadConditionsStaticIcon from '../../images/mapIcons/road-condition-static.png';

// Chain Ups
import chainUpsStaticIcon from '../../images/mapIcons/chain-ups-static.png';

// Constructions
import constructionsMajorStaticIcon from '../../images/mapIcons/delay-major-static.png';
import constructionsStaticIcon from '../../images/mapIcons/delay-minor-static.png';

// Generic Events
import genericDelaysMajorStaticIcon from '../../images/mapIcons/incident-major-static.png';
import genericDelaysStaticIcon from '../../images/mapIcons/incident-minor-static.png';

// Map advisory styles
export const advisoryStyles = {
  static: new Style({
    stroke: new Stroke({
      color: 'rgba(242, 76, 39)',
      width: 2,
      lineDash: [5,5]
    }),
    fill: new Fill({
      color: 'rgba(252, 214, 192, 0.25)',
    }),
  }),
  hover: new Style({
    stroke: new Stroke({
      color: 'rgba(248, 165, 147)',
      width: 2,
      lineDash: [5,5]
    }),
    fill: new Fill({
      color: 'rgba(252, 214, 192, 0.65)',
    }),
  }),
  active: new Style({
    stroke: new Stroke({
      color: 'rgba(242, 76, 39)',
      width: 2,
      lineDash: [5,5]
    }),
    fill: new Fill({
      color: 'rgba(252, 214, 192, 0.65)',
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
      src: cameraIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: cameraIconActive,
    }),
  }),
};

export const unreadCameraStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: cameraIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: cameraIconStatic,
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
      src: ferryIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: ferryIconStatic,
    }),
  }),
};
export const coastalFerryStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: coastalFerryIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: coastalFerryIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: coastalFerryIconStatic,
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
      src: roadWeatherIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: roadWeatherIconStatic,
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
      src: regionalWeatherIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: regionalWeatherIconStatic,
    }),
  }),
};

export const regionalWarningStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: regionalWeatherWarningIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: regionalWeatherWarningIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: regionalWeatherWarningIconStatic,
    }),
  }),
};

// High elevation forecase styles
export const hefStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: hefIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: hefIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: hefIconStatic,
    }),
  }),
};

// High elevation forecase styles
export const hefWarningStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: hefIconWarningStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: hefIconWarningStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: hefIconWarningStatic,
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
      src: restStopIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconStatic,
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
      src: restStopIconStaticTruck,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconStaticTruck,
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
      src: restStopIconStaticClosed,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconStaticClosed,
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
      src: restStopIconStaticTruckClosed,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: restStopIconStaticTruckClosed,
    }),
  }),
};

// Event icon styles
export const eventStyles = {
  // Line Segments
  segments: {
    closure: {
      static: [
        new Style({
          stroke: new Stroke({
            color: 'rgba(204, 0, 0, 0.7)',
            width: 8,
          }),
        }),
        new Style({
          stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.8)',
            width: 4,
          }),
        }),
      ],
      hover: [
        new Style({
          stroke: new Stroke({
            color: 'rgba(204, 0, 0, 1)',
            width: 10,
          }),
        }),
        new Style({
          stroke: new Stroke({
            color: 'rgba(255, 255, 255, 1)',
            width: 6,
          }),
        }),
      ],
      active: [
        new Style({
          stroke: new Stroke({
            color: 'rgba(204, 0, 0, 0.85)',
            width: 10,
          }),
        }),
        new Style({
          stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.85)',
            width: 6,
          }),
        }),
      ]
    },

    majorEvents: {
      static: new Style({
        stroke: new Stroke({
          color: 'rgba(204, 0, 0, 0.5)',
          width: 8,
        }),
      }),
      hover: new Style({
        stroke: new Stroke({
          color: 'rgba(204, 0, 0, 0.8)',
          width: 10,
          zIndex: 900,
        }),
      }),
      active: new Style({
        stroke: new Stroke({
          color: 'rgba(204, 0, 0, 0.65)',
          width: 10,
        }),
      })
    },

    conditions: {
      static: new Style({
        stroke: new Stroke({
          color: 'rgba(204, 0, 0, 1)',
          width: 8,
        }),
      }),
      hover: new Style({
        stroke: new Stroke({
          color: 'rgba(255, 0, 0, 1)',
          width: 10,
          zIndex: 300,
        }),
      }),
      active: new Style({
        stroke: new Stroke({
          color: 'rgba(255, 0, 0, 0.9)',
          width: 10,
        }),
      })
    },

    roadConditions: {
      static: new Style({
        stroke: new Stroke({
          color: 'rgba(100, 74, 10, 0.5)',
          width: 2,
        }),
        fill: new Fill({ color: 'rgba(255,181,0,0.1)' }),
      }),
      hover: new Style({
        stroke: new Stroke({
          color: 'rgba(100, 74, 10, 0.75)',
          width: 3,
        }),
        fill: new Fill({ color: 'rgba(255, 181, 0, 0.35)' }),
      }),
      active: new Style({
        stroke: new Stroke({
          color: 'rgba(100, 74, 10, 1)',
          width: 3,
        }),
        fill: new Fill({ color: 'rgba(255, 181, 0, 0.25)' }),
      }),
    },

    chainUps: {
      static: new Style({
        stroke: new Stroke({
          color: 'rgba(45, 45, 45, 0.75)',
          width: 2,
          lineDash: [6, 5],
        }),
        fill: new Fill({ color: 'rgba(246, 226, 75, 0.15)' }),
      }),
      hover: new Style({
        stroke: new Stroke({
          color: 'rgba(45, 45, 45, 0.75)',
          width: 3,
          lineDash: [6, 5],
        }),
        fill: new Fill({ color: 'rgba(255, 241, 133, 0.35)' }),
      }),
      active: new Style({
        stroke: new Stroke({
          color: 'rgba(45, 45, 45, 1)',
          width: 3,
          lineDash: [6, 5],
        }),
        fill: new Fill({ color: 'rgba(246, 226, 75, 0.25)' }),
      }),
    },

    minorEvents: {
      static: new Style({
        stroke: new Stroke({
          color: 'rgba(144 ,164 ,190, 0)',
          width: 8,
        }),
      }),
      hover: new Style({
        stroke: new Stroke({
          color: 'rgba(232 ,192 ,97, 0.75)',
          width: 10,
          zIndex: 300,
        }),
      }),
      active: new Style({
        stroke: new Stroke({
          color: 'rgba(252 ,186 ,25, 0.9)',
          width: 10,
        }),
      })
    },

    futureEvents: {
      static: new Style({
        stroke: new Stroke({
          color: 'rgba(144 ,164 ,190, 0)',
          width: 8,
        }),
      }),
      hover: new Style({
        stroke: new Stroke({
          color: 'rgba(232 ,192 ,97, 0.75)',
          width: 10,
          zIndex: 300,
        }),
      }),
      active: new Style({
        stroke: new Stroke({
          color: 'rgba(252 ,186 ,25, 0.9)',
          width: 10,
        }),
      })
    },
  },

  polygon: [
    {
      'stroke-color': ['get', 'strokeColor'],
      'stroke-width': ['get', 'strokeWidth'],
      'stroke-line-dash': [ 6, 3 ],
      'stroke-offset': ['get', 'strokeOffset'],
      'stroke-miter-limit': 10,
      'stroke-line-cap': 'butt',
      'stroke-line-join': 'miter',
      'stroke-line-dash-offset': 0,
    }, {
      'fill-color': ['get', 'fillColor'],
    }
  ],

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
        src: closuresStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: closuresStaticIcon,
      }),
    }),
  },
  closures_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: closuresStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: closuresStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: closuresStaticIcon,
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
        src: futureEventsMajorStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsMajorStaticIcon,
      }),
    }),
  },

  major_future_events_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsMajorStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsMajorStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsMajorStaticIcon,
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
        src: futureEventsStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsStaticIcon,
      }),
    }),
  },

  future_events_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureEventsStaticIcon,
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
        src: roadConditionsStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsStaticIcon,
      }),
    }),
  },

  road_conditions_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: roadConditionsStaticIcon,
      }),
    }),
  },

  // Chain Ups
  chain_ups: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: chainUpsStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: chainUpsStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: chainUpsStaticIcon,
      }),
    }),
  },

  chain_ups_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: chainUpsStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: chainUpsStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: chainUpsStaticIcon,
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
        src: constructionsMajorStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsMajorStaticIcon,
      }),
    }),
  },

  major_constructions_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsMajorStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsMajorStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsMajorStaticIcon,
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
        src: constructionsStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsStaticIcon,
      }),
    }),
  },

  constructions_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: constructionsStaticIcon,
      }),
    }),
  },

  // Future closures
  future_closures: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureClosureStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureClosureStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureClosureStaticIcon,
      }),
    }),
  },

  future_closures_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureClosureStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureClosureStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: futureClosureStaticIcon,
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
        src: genericDelaysMajorStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysMajorStaticIcon,
      }),
    }),
  },

  major_generic_delays_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysMajorStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysMajorStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysMajorStaticIcon,
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
        src: genericDelaysStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysStaticIcon,
      }),
    }),
  },

  generic_delays_unread: {
    static: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysStaticIcon,
      }),
    }),

    hover: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysStaticIcon,
      }),
    }),

    active: new Style({
      image: new Icon({
        scale: 0.25,
        src: genericDelaysStaticIcon,
      }),
    }),
  }
};

// Route styles
export const routeStyles = {
  static: [
    new Style({
      stroke: new Stroke({
        color: 'rgba(85, 149, 217, 1)',
        width: 6,
      }),
      zIndex: 6
    }),
    new Style({
      stroke: new Stroke({
        color: 'rgba(216, 234, 253, 1)',
        width: 4,
      }),
      zIndex: 6
    }),
  ],
  hover: [
    new Style({
      stroke: new Stroke({
        color: 'rgba(168, 208, 251, 1)',
        width: 6,
      }),
      zIndex: 8
    }),
    new Style({
      stroke: new Stroke({
        color: 'rgba(83, 134, 237, 1)',
        width: 4,
      }),
      zIndex: 8
    }),
  ],
  active: [
    new Style({
      stroke: new Stroke({
        color: 'rgba(85, 149, 217, 1)',
        width: 6,
      }),
      zIndex: 7
    }),
    new Style({
      stroke: new Stroke({
        color: 'rgba(30, 83, 167, 1)',
        width: 4,
      }),
      zIndex: 7
    }),
  ],
};

// Border crossing styles
export const borderCrossingStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: borderIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: borderIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: borderIconStatic,
    }),
  }),
};


// Wildfire styles
export const wildfireAreaStyles = {
  static: new Style({
    stroke: new Stroke({
      color: 'rgba(242, 76, 39)',
      width: 2,
      lineDash: [5,5]
    }),
    fill: new Fill({
      color: 'rgba(210, 55, 55, 0.20)',
    }),
  }),
  hover: new Style({
    stroke: new Stroke({
      color: 'rgba(248, 165, 147)',
      width: 2,
      lineDash: [5,5]
    }),
    fill: new Fill({
      color: 'rgba(210, 55, 55, 0.12)',
    }),
  }),
  active: new Style({
    stroke: new Stroke({
      color: 'rgba(242, 76, 39)',
      width: 2,
      lineDash: [5,5]
    }),
    fill: new Fill({
      color: 'rgba(210, 55, 55, 0.28)',
    }),
  })
};

export const wildfireCentroidStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: wildfireIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: wildfireIconStatic,
    }),
  }),
  active: new Style({
    image: new Icon({
      scale: 0.25,
      src: wildfireIconStatic,
    }),
  }),
};

export const wildfireUnreadStyles = {
  static: new Style({
    image: new Icon({
      scale: 0.25,
      src: wildfireIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      scale: 0.25,
      src: wildfireIconStatic,
    }),
  })
};

// Dynamic loading of hover/active and unread icons
const loadIcons = () => {
  const update = (style, src) => style.setImage(new Icon({ scale: 0.25, src }));

  // Hover/Active Group (Fast Follow)
  // Cameras
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/camera-hover.png').then(m => update(cameraStyles.hover, m.default));

  // Ferries
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/ferry-active.png').then(m => update(ferryStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/ferry-hover.png').then(m => update(ferryStyles.hover, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/coastal-ferry-active.png').then(m => update(coastalFerryStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/coastal-ferry-hover.png').then(m => update(coastalFerryStyles.hover, m.default));

  // Weather
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/road-weather-active.png').then(m => update(roadWeatherStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/road-weather-hover.png').then(m => update(roadWeatherStyles.hover, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/regional-weather-active.png').then(m => update(regionalStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/regional-weather-hover.png').then(m => update(regionalStyles.hover, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/regional-weather-advisory-active.png').then(m => update(regionalWarningStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/regional-weather-advisory-hover.png').then(m => update(regionalWarningStyles.hover, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/elevation-active.png').then(m => update(hefStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/elevation-hover.png').then(m => update(hefStyles.hover, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/elevation-advisory-active.png').then(m => update(hefWarningStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/elevation-advisory-hover.png').then(m => update(hefWarningStyles.hover, m.default));

  // Border
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/border-active.png').then(m => update(borderCrossingStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/border-hover.png').then(m => update(borderCrossingStyles.hover, m.default));

  // Wildfire
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/wildfire/wildfires-active.png').then(m => update(wildfireCentroidStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/wildfire/wildfires-hover.png').then(m => update(wildfireCentroidStyles.hover, m.default));

  // Rest Stops
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/restarea-open-active.png').then(m => update(restStopStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/restarea-open-hover.png').then(m => update(restStopStyles.hover, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/restarea-closed-active.png').then(m => update(restStopClosedStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/restarea-closed-hover.png').then(m => update(restStopClosedStyles.hover, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/restarea-truck-open-active.png').then(m => update(restStopTruckStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/restarea-truck-open-hover.png').then(m => update(restStopTruckStyles.hover, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/restarea-truck-closed-active.png').then(m => update(restStopTruckClosedStyles.active, m.default));
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/restarea-truck-closed-hover.png').then(m => update(restStopTruckClosedStyles.hover, m.default));

  // Events
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/closure-active.png').then(m => {
    update(eventStyles.closures.active, m.default);
    update(eventStyles.closures_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/closure-hover.png').then(m => update(eventStyles.closures.hover, m.default));

  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/future-closure-active.png').then(m => {
    update(eventStyles.future_closures.active, m.default);
    update(eventStyles.future_closures_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/future-closure-hover.png').then(m => update(eventStyles.future_closures.hover, m.default));

  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/future-event-major-active.png').then(m => {
    update(eventStyles.major_future_events.active, m.default);
    update(eventStyles.major_future_events_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/future-event-major-hover.png').then(m => update(eventStyles.major_future_events.hover, m.default));

  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/future-event-minor-active.png').then(m => {
    update(eventStyles.future_events.active, m.default);
    update(eventStyles.future_events_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/future-event-minor-hover.png').then(m => update(eventStyles.future_events.hover, m.default));

  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/road-condition-active.png').then(m => {
    update(eventStyles.road_conditions.active, m.default);
    update(eventStyles.road_conditions_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/road-condition-hover.png').then(m => update(eventStyles.road_conditions.hover, m.default));

  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/chain-ups-active.png').then(m => {
    update(eventStyles.chain_ups.active, m.default);
    update(eventStyles.chain_ups_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/chain-ups-hover.png').then(m => update(eventStyles.chain_ups.hover, m.default));

  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/delay-major-active.png').then(m => {
    update(eventStyles.major_constructions.active, m.default);
    update(eventStyles.major_constructions_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/delay-major-hover.png').then(m => update(eventStyles.major_constructions.hover, m.default));

  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/delay-minor-active.png').then(m => {
    update(eventStyles.constructions.active, m.default);
    update(eventStyles.constructions_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/delay-minor-hover.png').then(m => update(eventStyles.constructions.hover, m.default));

  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/incident-major-active.png').then(m => {
    update(eventStyles.major_generic_delays.active, m.default);
    update(eventStyles.major_generic_delays_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/incident-major-hover.png').then(m => update(eventStyles.major_generic_delays.hover, m.default));

  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/incident-minor-active.png').then(m => {
    update(eventStyles.generic_delays.active, m.default);
    update(eventStyles.generic_delays_unread.active, m.default);
  });
  import(/* webpackChunkName: "map-icons-hover" */ '../../images/mapIcons/incident-minor-hover.png').then(m => update(eventStyles.generic_delays.hover, m.default));


  // Unread Group (Lazy)
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/camera-static-unread.png').then(m => update(unreadCameraStyles.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/camera-hover-unread.png').then(m => update(unreadCameraStyles.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/wildfire/wildfires-static-unread.png').then(m => update(wildfireUnreadStyles.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/wildfire/wildfires-hover-unread.png').then(m => update(wildfireUnreadStyles.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/closure-static-unread.png').then(m => update(eventStyles.closures_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/closure-hover-unread.png').then(m => update(eventStyles.closures_unread.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/future-closure-static-unread.png').then(m => update(eventStyles.future_closures_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/future-closure-hover-unread.png').then(m => update(eventStyles.future_closures_unread.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/future-event-major-static-unread.png').then(m => update(eventStyles.major_future_events_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/future-event-major-hover-unread.png').then(m => update(eventStyles.major_future_events_unread.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/future-event-minor-static-unread.png').then(m => update(eventStyles.future_events_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/future-event-minor-hover-unread.png').then(m => update(eventStyles.future_events_unread.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/road-condition-static-unread.png').then(m => update(eventStyles.road_conditions_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/road-condition-hover-unread.png').then(m => update(eventStyles.road_conditions_unread.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/chain-ups-static-unread.png').then(m => update(eventStyles.chain_ups_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/chain-ups-hover-unread.png').then(m => update(eventStyles.chain_ups_unread.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/delay-major-static-unread.png').then(m => update(eventStyles.major_constructions_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/delay-major-hover-unread.png').then(m => update(eventStyles.major_constructions_unread.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/delay-minor-static-unread.png').then(m => update(eventStyles.constructions_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/delay-minor-hover-unread.png').then(m => update(eventStyles.constructions_unread.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/incident-major-static-unread.png').then(m => update(eventStyles.major_generic_delays_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/incident-major-hover-unread.png').then(m => update(eventStyles.major_generic_delays_unread.hover, m.default));

  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/incident-minor-static-unread.png').then(m => update(eventStyles.generic_delays_unread.static, m.default));
  import(/* webpackChunkName: "map-icons-unread" */ '../../images/mapIcons/incident-minor-hover-unread.png').then(m => update(eventStyles.generic_delays_unread.hover, m.default));
};

loadIcons();
