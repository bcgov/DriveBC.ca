import {Icon, Stroke, Style} from 'ol/style.js';
import { Point } from 'ol/geom';
import cameraIconActive from "../../images/mapIcons/camera-active.png";
import cameraIconHover from "../../images/mapIcons/camera-hover.png";
import cameraIconStatic from "../../images/mapIcons/camera-static.png";
import incidentIconActive from "../../images/mapIcons/incident-minor-active.png";
import incidentIconHover from "../../images/mapIcons/incident-minor-hover.png";
import incidentIconStatic from "../../images/mapIcons/incident-minor-static.png";
import incidentIconActiveMajor from "../../images/mapIcons/incident-major-active.png";
import incidentIconHoverMajor from "../../images/mapIcons/incident-major-hover.png";
import incidentIconStaticMajor from "../../images/mapIcons/incident-major-static.png";
import constructionIconActive from "../../images/mapIcons/currentevent-minor-active.png";
import constructionIconHover from "../../images/mapIcons/currentevent-minor-hover.png";
import constructionIconStatic from "../../images/mapIcons/currentevent-minor-static.png";
import constructionIconActiveMajor from "../../images/mapIcons/currentevent-major-active.png";
import constructionIconHoverMajor from "../../images/mapIcons/currentevent-major-hover.png";
import constructionIconStaticMajor from "../../images/mapIcons/currentevent-major-static.png";
import specialEventIconActive from "../../images/mapIcons/futureevent-minor-active.png";
import specialEventIconHover from "../../images/mapIcons/futureevent-minor-hover.png";
import specialEventIconStatic from "../../images/mapIcons/futureevent-minor-static.png";
import specialEventIconActiveMajor from "../../images/mapIcons/futureevent-major-active.png";
import specialEventIconHoverMajor from "../../images/mapIcons/futureevent-major-hover.png";
import specialEventIconStaticMajor from "../../images/mapIcons/futureevent-major-static.png";
import weatherConditionIconActive from "../../images/mapIcons/road-minor-active.png";
import weatherConditionIconHover from "../../images/mapIcons/road-minor-hover.png";
import weatherConditionIconStatic from "../../images/mapIcons/road-minor-static.png";
import weatherConditionIconActiveMajor from "../../images/mapIcons/road-major-active.png";
import weatherConditionIconHoverMajor from "../../images/mapIcons/road-major-hover.png";
import weatherConditionIconStaticMajor from "../../images/mapIcons/road-major-static.png";


// Camera icon styles
export const cameraStyles = {
  static: new Style({
    image: new Icon({
      anchor: [24, 24],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 0.25,
      src: cameraIconStatic,
    }),
  }),
  hover: new Style({
    image: new Icon({
      anchor: [24, 24],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 0.25,
      src: cameraIconHover,
    }),
  }),
  active: new Style({
    image: new Icon({
      anchor: [24, 24],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 0.25,
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
        scale: 0.25,
        src: incidentIconStatic,
      }),
    }),

    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: incidentIconHover,
      }),
    }),

    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: incidentIconActive,
      }),
    }),
  },

  major_incident: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: incidentIconStaticMajor,
      }),
    }),

    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: incidentIconHoverMajor,
      }),
    }),

    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: incidentIconActiveMajor,
      }),
    }),
  },

  construction: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: constructionIconStatic,
      }),
    }),

    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: constructionIconHover,
      }),
    }),

    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: constructionIconActive,
      }),
    }),
  },

  major_construction: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: constructionIconStaticMajor,
      }),
    }),

    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: constructionIconHoverMajor,
      }),
    }),

    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: constructionIconActiveMajor,
      }),
    }),
  },

  special_event: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: specialEventIconStatic,
      }),
    }),

    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: specialEventIconHover,
      }),
    }),

    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: specialEventIconActive,
      }),
    }),
  },

  major_special_event: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: specialEventIconStaticMajor,
      }),
    }),

    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: specialEventIconHoverMajor,
      }),
    }),

    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: specialEventIconActiveMajor,
      }),
    }),
  },

  weather_condition: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: weatherConditionIconStatic,
      }),
    }),

    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: weatherConditionIconHover,
      }),
    }),

    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: weatherConditionIconActive,
      }),
    }),
  },

  major_weather_condition: {
    static: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: weatherConditionIconStaticMajor,
      }),
    }),

    hover: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: weatherConditionIconHoverMajor,
      }),
    }),

    active: new Style({
      image: new Icon({
        anchor: [24, 24],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        scale: 0.25,
        src: weatherConditionIconActiveMajor,
      }),
    }),
  },
};
// Event segments styles
export function getSegmentStyles(feature, state) {
  const centroidIndex = Math.floor(feature.getGeometry().getCoordinates().length / 2);
  const centroid = feature.getGeometry().getCoordinates()[centroidIndex];
  const centroidPoint = new Point(centroid);
  switch (state) {
    case 'static':
      return [
        new Style({
          stroke: new Stroke({
            color: 'rgba(216 ,41 ,47, 0.5)',
            width: 12,
          }),
        }),
        new Style({
          geometry: centroidPoint,
          image: new Icon({
            src: weatherConditionIconStatic,
            anchor: [24, 24],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            scale: 1,
          }),
        }),
      ];
    case 'hover':
      return [
        new Style({
          stroke: new Stroke({
            color: 'rgba(216 ,41 ,47, 0.5)',
            width: 12,
          }),
        }),
        new Style({
          geometry: centroidPoint,
          image: new Icon({
            src: weatherConditionIconHover,
            anchor: [24, 24],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            scale: 1,
          }),
        }),
      ];
    case 'active':
      return [
        new Style({
          stroke: new Stroke({
            color: 'rgba(216 ,41 ,47, 0.9)',
            width: 12,
          }),
        }),
        new Style({
          geometry: centroidPoint,
          image: new Icon({
            src: weatherConditionIconActive,
            anchor: [24, 24],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            scale: 1,
          }),
        }),
      ];
  }
}
