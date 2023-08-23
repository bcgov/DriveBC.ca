import {Icon, Stroke, Style} from 'ol/style.js';
import cameraIconActive from "../../images/camera-active.svg";
import cameraIconHover from "../../images/camera-hover.svg";
import cameraIconStatic from "../../images/camera-static.svg";
import eventIconActive from "../../images/incident-active.svg";
import eventIconHover from "../../images/incident-hover.svg";
import eventIconStatic from "../../images/incident-static.svg";


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
  static: new Style({
    image: new Icon({
      anchor: [24, 24],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 1,
      src: eventIconStatic,
    }),
  }),

  hover: new Style({
    image: new Icon({
      anchor: [24, 24],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 1,
      src: eventIconHover,
    }),
  }),

  active: new Style({
    image: new Icon({
      anchor: [24, 24],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 1,
      src: eventIconActive,
    }),
  }),

  RoadConditions: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 255, 255, 0.6)',
      width: 8,
    }),
  }),

};
