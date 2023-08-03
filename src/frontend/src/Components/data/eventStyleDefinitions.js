import { Icon, Stroke, Style } from "ol/style.js";
import eventIcon from "../../assets/exclamation-triangle-solid.png";
import videoIcon from "../../assets/video-solid.png";


export const webcamStyles = {
    default: new Style({
        image: new Icon({
          anchor: [24, 24],
          anchorXUnits: "pixels",
          anchorYUnits: "pixels",
          scale: 0.5,
          src: videoIcon,
        }),
      })
}
export const eventStyles = {
    Points: new Style({
        image: new Icon({
          anchor: [24, 24],
          anchorXUnits: "pixels",
          anchorYUnits: "pixels",
          scale: 0.5,
          src: eventIcon,
        }),
      }),

      RoadConditions: new Style({
        stroke: new Stroke({
            color: "rgba(0, 255, 255, 0.6)",
            width: 8
        })
      })


}
