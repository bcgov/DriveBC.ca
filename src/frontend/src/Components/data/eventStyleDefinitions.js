import {Icon, Stroke, Style} from 'ol/style.js';
import cameraIconActive from "../../images/mapIcons/camera-active.svg";
import cameraIconHover from "../../images/mapIcons/camera-hover.svg";
import cameraIconStatic from "../../images/mapIcons/camera-static.svg";
import incidentIconActive from "../../images/mapIcons/incident-active.svg";
import incidentIconHover from "../../images/mapIcons/incident-hover.svg";
import incidentIconStatic from "../../images/mapIcons/incident-static.svg";
import incidentIconActiveMajor from "../../images/mapIcons/major-incident-active.svg";
import incidentIconHoverMajor from "../../images/mapIcons/major-incident-hover.svg";
import incidentIconStaticMajor from "../../images/mapIcons/major-incident-static.svg";
import constructionIconActive from "../../images/mapIcons/construction-active.svg";
import constructionIconHover from "../../images/mapIcons/construction-hover.svg";
import constructionIconStatic from "../../images/mapIcons/construction-static.svg";
import constructionIconActiveMajor from "../../images/mapIcons/major-construction-active.svg";
import constructionIconHoverMajor from "../../images/mapIcons/major-construction-hover.svg";
import constructionIconStaticMajor from "../../images/mapIcons/major-construction-static.svg";
import specialEventIconActive from "../../images/mapIcons/special_event-active.svg";
import specialEventIconHover from "../../images/mapIcons/special_event-hover.svg";
import specialEventIconStatic from "../../images/mapIcons/special_event-static.svg";
import specialEventIconActiveMajor from "../../images/mapIcons/major-special_event-active.svg";
import specialEventIconHoverMajor from "../../images/mapIcons/major-special_event-hover.svg";
import specialEventIconStaticMajor from "../../images/mapIcons/major-special_event-static.svg";
import weatherConditionIconActive from "../../images/mapIcons/weather_condition-active.svg";
import weatherConditionIconHover from "../../images/mapIcons/weather_condition-hover.svg";
import weatherConditionIconStatic from "../../images/mapIcons/weather_condition-static.svg";
import weatherConditionIconActiveMajor from "../../images/mapIcons/major-weather_condition-active.svg";
import weatherConditionIconHoverMajor from "../../images/mapIcons/major-weather_condition-hover.svg";
import weatherConditionIconStaticMajor from "../../images/mapIcons/major-weather_condition-static.svg";


// Camera icon styles
export const cameraStyles = {
  static: new Style({
    image: new Icon({
      anchor: [24, 24],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 1,
      src: cameraIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      anchor: [24, 24],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 1,
      src: cameraIconHover,
    }),
  }),
  active: new Style({
    image: new Icon({
      anchor: [24, 24],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 1,
      src: cameraIconActive,
    }),
  }),
};

// Event icon styles
export const eventStyles = {
  incident: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: incidentIconStatic,
      }),
    }),
  
    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: incidentIconHover,
      }),
    }),
  
    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: incidentIconActive,
      }),
    })
  },

  major_incident: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: incidentIconStaticMajor,
      }),
    }),
  
    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: incidentIconHoverMajor,
      }),
    }),
  
    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: incidentIconActiveMajor,
      }),
    })
  },

  construction: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: constructionIconStatic,
      }),
    }),
  
    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: constructionIconHover,
      }),
    }),
  
    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: constructionIconActive,
      }),
    })
  },

  major_construction: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: constructionIconStaticMajor,
      }),
    }),
  
    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: constructionIconHoverMajor,
      }),
    }),
  
    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: constructionIconActiveMajor,
      }),
    })
  },

  special_event: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: specialEventIconStatic,
      }),
    }),
  
    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: specialEventIconHover,
      }),
    }),
  
    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: specialEventIconActive,
      }),
    })
  },

  major_special_event: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: specialEventIconStaticMajor,
      }),
    }),
  
    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: specialEventIconHoverMajor,
      }),
    }),
  
    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: specialEventIconActiveMajor,
      }),
    })
  },

  weather_condition: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: weatherConditionIconStatic,
      }),
    }),
  
    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: weatherConditionIconHover,
      }),
    }),
  
    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: weatherConditionIconActive,
      }),
    })
  },

  major_weather_condition: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: weatherConditionIconStaticMajor,
      }),
    }),
  
    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: weatherConditionIconHoverMajor,
      }),
    }),
  
    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 1,
        src: weatherConditionIconActiveMajor,
      }),
    })
  },

  // Event segments styles
  segments: {
    static: new Style({
      stroke: new Stroke({
        color: 'rgba(0, 255, 255, 0.6)',
        width: 8,
      }),
    }),
    hover: new Style({
      stroke: new Stroke({
        color: 'rgba(0, 255, 255, 0.6)',
        width: 12,
      }),
    }),
    hover: new Style({
      stroke: new Stroke({
        color: 'rgba(0, 255, 255, 1)',
        width: 12,
      }),
    })
  }
};
