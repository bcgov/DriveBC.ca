// React
import React, { useContext, useRef, useEffect, useState } from "react";

// Third party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faUpRightAndDownLeftFromCenter,
  faLocationCrosshairs
} from "@fortawesome/free-solid-svg-icons";
import Button from "react-bootstrap/Button";

// Components and functions
import { getEventPoints } from "./data/events.js";
import { getWebcams } from "./data/webcams.js";
import Layers from "./Layers.js";
import Routes from "./Routes.js";

// OpenLayers
import { applyStyle } from "ol-mapbox-style";
import { fromLonLat } from "ol/proj";
import { Icon, Style } from "ol/style.js";
import { Image as ImageLayer } from "ol/layer.js";
import { MapContext } from "../App.js";
import * as ol from "ol";
import Cluster from "ol/source/Cluster.js";
import GeoJSON from "ol/format/GeoJSON.js";
import ImageWMS from "ol/source/ImageWMS.js";
import Map from "ol/Map";
import MVT from "ol/format/MVT.js";
import Point from "ol/geom/Point.js";
import Popup from "ol-popup";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import VectorTileLayer from "ol/layer/VectorTile.js";
import VectorTileSource from "ol/source/VectorTile.js";
import View from "ol/View";
import {ZoomSlider} from 'ol/control.js';

// Static files
import eventIcon from "../assets/exclamation-triangle-solid.png";
import videoIcon from "../assets/video-solid.png";

// Styling
import "./Map.scss";

export default function MapWrapper({
  camera,
  isPreview,
  cameraHandler,
  mapViewRoute,
}) {
  const { mapContext, setMapContext } = useContext(MapContext);

  const mapElement = useRef();
  const mapRef = useRef();
  const layers = useRef({});
  const mapView = useRef();
  const lng = -120.7862;
  const lat = 50.113;
  const [layersOpen, setLayersOpen] = useState(false);
  const [routesOpen, setRoutesOpen] = useState(false);

  useEffect(() => {
    // initialization hook for the OpenLayers map logic
    if (mapRef.current) return; //stops map from intializing more than once

    const vectorLayer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: "https://tiles.arcgis.com/tiles/ubm4tcTYICKBpist/arcgis/rest/services/BC_BASEMAP/VectorTileServer/tile/{z}/{y}/{x}.pbf",
      }),
    });

    // initialize starting optional layers
    layers.current = {
      highwayLayer: new ImageLayer({
        classname: "highway",
        type: "overlay",
        visible: mapContext.visible_layers.highwayLayer,
        source: new ImageWMS({
          url: "https://dev-maps.th.gov.bc.ca/geoV05/hwy/wms",
          serverType: "geoserver",
          params: {
            LAYERS: "hwy:DSA_CONTRACT_AREA",
          },
          transition: 0,
        }),
      }),

      open511Layer: new ImageLayer({
        className: "open511",
        type: "overlay",
        visible: mapContext.visible_layers.highwayLayer,
        source: new ImageWMS({
          url: "https://dev-maps.th.gov.bc.ca/geoV05/op5/wms",
          params: {
            LAYERS: "op5:OP5_EVENT511_ACTIVE_V",
          },
          serverType: "geoserver",
          transition: 0,
        }),
      }),

      tid: Date.now(),
    };

    mapView.current = new View({
      projection: "EPSG:3857",
      constrainResolution: true,
      center: camera
        ? fromLonLat(camera.location.coordinates)
        : fromLonLat([lng, lat]),
      zoom: 12,
    });
    //Apply the basemap style from the arcgis resource
    fetch(
      "https://www.arcgis.com/sharing/rest/content/items/b1624fea73bd46c681fab55be53d96ae/resources/styles/root.json",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    ).then(function (response) {
      response.json().then(function (glStyle) {
        //overriding default font value so it doesn't return errors.
        glStyle.metadata["ol:webfonts"] = "";
        applyStyle(vectorLayer, glStyle, "esri");
      });
    });

    // create map
    mapRef.current = new Map({
      target: mapElement.current,
      layers: [
        vectorLayer,
        layers.current["highwayLayer"],
        layers.current["open511Layer"],
      ],
      overlays: [],
      view: mapView.current,
      controls: [new ZoomSlider()],
    });

    // initialize event and webcam popup
    var popup = new Popup();
    mapRef.current.addOverlay(popup);

    // initialize zoom slider
    // const zoomslider = new ZoomSlider();
    // mapRef.current.addControl(zoomslider);

    mapRef.current.once("loadend", async () => {
      const { webcamResults } = await getWebcams();
      const evpoints = await getEventPoints();

      layers.current["webcamsLayer"] = new VectorLayer({
        classname: "webcams",
        visible: mapContext.visible_layers.webcamsLayer,
        source: new Cluster({
          distance: 35,
          source: new VectorSource({
            format: new GeoJSON(),
            loader: function (extent, resolution, projection) {
              var vectorSource = this;
              vectorSource.clear();

              if (webcamResults) {
                webcamResults.forEach((cameraData) => {
                  //Build a new OpenLayers feature
                  var olGeometry = new Point(cameraData.location.coordinates);
                  var olFeature = new ol.Feature({ geometry: olGeometry });

                  //Transfer properties
                  olFeature.setProperties(cameraData);

                  // Transform the projection
                  var olFeatureForMap = transformFeature(
                    olFeature,
                    "EPSG:4326",
                    mapRef.current.getView().getProjection().getCode()
                  );

                  vectorSource.addFeature(olFeatureForMap);
                });
              }
            },
          }),
        }),
        style: new Style({
          image: new Icon({
            anchor: [24, 24],
            anchorXUnits: "pixels",
            anchorYUnits: "pixels",
            scale: 0.5,
            src: videoIcon,
          }),
        }),
      });

      mapRef.current.addLayer(layers.current["webcamsLayer"]);

      layers.current["eventsLayer"] = new VectorLayer({
        classname: "events",
        visible: mapContext.visible_layers.eventsLayer,
        source: new Cluster({
          distance: 35,
          source: new VectorSource({
            format: new GeoJSON(),
            loader: function (extent, resolution, projection) {
              var vectorSource = this;
              vectorSource.clear();
              if (evpoints) {
                evpoints.forEach((feature) => {
                  var olGeometry = new Point([
                    feature.geometry.coordinates[0],
                    feature.geometry.coordinates[1],
                  ]);
                  var olFeature = new ol.Feature({ geometry: olGeometry });

                  //Transfer properties to OpenLayers feature-friendly format
                  var properties = {};
                  properties["id"] = feature.id;
                  properties["headline"] = feature.properties.event_type;
                  properties["status"] = feature.properties.status;
                  properties["description"] = feature.properties.description;
                  properties["event_type"] = feature.properties.description;
                  properties["event_subtypes"] =
                    feature.properties.event_subtypes;
                  olFeature.setProperties(properties);

                  // Transform the projection
                  var olFeatureForMap = transformFeature(
                    olFeature,
                    "EPSG:4326",
                    mapRef.current.getView().getProjection().getCode()
                  );

                  vectorSource.addFeature(olFeatureForMap);
                });
              }
            },
          }),
        }),
        style: new Style({
          image: new Icon({
            anchor: [24, 24],
            anchorXUnits: "pixels",
            anchorYUnits: "pixels",
            scale: 0.5,
            src: eventIcon,
          }),
        }),
      });
      mapRef.current.addLayer(layers.current["eventsLayer"]);

      // let interval = setInterval(async () => {
      //   const travalad = await getAdvisories();
      //   setAdvisories(travalad);
      // }, 10000);
    });

    mapRef.current.on("click", (e) => {
      let iconClicked = false;
      const coordinate = e.coordinate;
      //check if it was a webcam icon that was clicked
      layers.current["webcamsLayer"]
        .getFeatures(e.pixel)
        .then((clickedFeatures) => {
          if (clickedFeatures[0]) {
            if (isPreview) {
              const clickedCamera =
                clickedFeatures[0].values_.features[0].values_;
              mapView.current.animate({
                center: fromLonLat(clickedCamera.location.coordinates),
              });
              cameraHandler(clickedCamera);
            } else {
              const feature = clickedFeatures[0].values_.features[0].values_;
              iconClicked = true;
              popup.show(
                coordinate,
                `<div style='text-align: left; padding: 1rem'>
               <h4>${feature.name}</h4>
               <img src="${feature.links.imageSource}" width='300'>
              <p>${feature.caption}</p>
               </div>`
              );
              iconClicked = true;
            }
          }
        });

      //if it wasn't a webcam icon, check if it was an event
      layers.current["eventsLayer"]
        .getFeatures(e.pixel)
        .then((clickedFeatures) => {
          if (clickedFeatures[0]) {
            const feature = clickedFeatures[0].values_.features[0].values_;

            popup.show(
              coordinate,
              `<div style='text-align: left; padding: 1rem'>
             <h4>${feature.headline}</h4>
            <p>${feature.description}</p>
             </div>`
            );
            iconClicked = true;
          }
        });

      //if neither, hide any existing popup
      if (!iconClicked) {
        popup.hide();
      }
    });
  }, []);

  function zoomIn() {
    if (!mapRef.current) {
      return;
    }
    const view = mapRef.current.getView();
    view.animate({
      zoom: view.getZoom() + 1,
      duration: 250,
    });
  }

  function zoomOut() {
    if (!mapRef.current) {
      return;
    }
    const view = mapRef.current.getView();
    view.animate({
      zoom: view.getZoom() - 1,
      duration: 250,
    });
  }

  function handleRecenter() {
    //TODO: reimpliment this in OpenLayers
    if (camera) {
      mapView.current.animate({
        center: fromLonLat(camera.location.coordinates),
      });
      return;
    }
  }

  function toggleLayers(openLayers) {
    setLayersOpen(openLayers);
    if (openLayers) {
      setRoutesOpen(false);
    }
  }

  function toggleRoutes(openRoutes) {
    setRoutesOpen(openRoutes);
    if (openRoutes) {
      setLayersOpen(false);
    }
  }

  function setStartToLocation() {
    if (!mapRef.current) {
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      const pos = [position.coords.longitude, position.coords.latitude];
      mapRef.current.setZoom(12);
      mapRef.current.setCenter(pos);

      // see comment in routeHandler for why we're using window.start
      window.start.setLngLat(pos).addTo(mapRef.current);
    });
  }

  function toggleLayer(layer, checked) {
    layers.current[layer].setVisible(checked);

    // Set context and local storage
    mapContext.visible_layers[layer] = checked;
    setMapContext(mapContext);
    localStorage.setItem("mapContext", JSON.stringify(mapContext));
  }

  function transformFeature(feature, sourceCRS, targetCRS) {
    var clone = feature.clone();
    clone.getGeometry().transform(sourceCRS, targetCRS);
    return clone;
  }

  return (
    <div className="map-container">
      <div ref={mapElement} className="map" />
        {isPreview && (
        <Button className="map-btn map-view" variant="outline-primary" onClick={mapViewRoute}>
          <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
          Map View
        </Button>
        )}

        <Button className="map-btn cam-location" variant="outline-primary" onClick={handleRecenter}>
          <FontAwesomeIcon icon={faLocationCrosshairs} />
          Camera location
        </Button>

        <Button className="map-btn zoom-in" variant="outline-primary" onClick={zoomIn}>
          <FontAwesomeIcon icon={faPlus} />
        </Button>

        <Button className="map-btn zoom-out" variant="outline-primary" onClick={zoomOut}>
          <FontAwesomeIcon icon={faMinus} />
        </Button>

      {!isPreview && (
        <div>
          <Routes
            open={routesOpen}
            setRoutesOpen={toggleRoutes}
            setStartToLocation={setStartToLocation}
          />
          <Layers
            open={layersOpen}
            setLayersOpen={toggleLayers}
            toggleLayer={toggleLayer}
          />
        </div>
      )}
    </div>
  );
}
