import React, { useRef, useEffect, useState } from "react";
import { useDrop } from "react-dnd";
import Popup from "ol-popup";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Point from "ol/geom/Point.js";
import * as ol from "ol";
import { Icon, Style } from "ol/style.js";
import ImageWMS from "ol/source/ImageWMS.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Map from "ol/Map";
import View from "ol/View";
import OSM from "ol/source/OSM.js";
import TileLayer from "ol/layer/Tile";
import { Image as ImageLayer } from "ol/layer.js";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster.js";
import MVT from "ol/format/MVT.js";
import VectorTileLayer from "ol/layer/VectorTile.js";
import VectorTileSource from "ol/source/VectorTile.js";
import { fromLonLat } from "ol/proj";
import { applyStyle } from "ol-mapbox-style";
import Advisory from "./Advisory.js";
import Layers from "./Layers.js";
import Routes from "./Routes.js";
import { getEvents } from "./data/events.js";
import { getWebcams } from "./data/webcams.js";
import { getAdvisories } from "./data/advisories.js";
import videoIcon from "../assets/video-solid.png";
import eventIcon from "../assets/exclamation-triangle-solid.png";
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationArrow,
  faPlus,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";

import "./Map.scss";

export default function MapWrapper() {
  const mapElement = useRef();
  const mapRef = useRef();


  const layers = useRef({});
  const mapView = useRef();
  const lng = -120.7862;
  const lat = 50.113;
  const start = new maplibregl.Marker({ color: "#003399", draggable: true });
  const end = new maplibregl.Marker({ color: "#009933", draggable: true });
  const [layersOpen, setLayersOpen] = useState(false);
  const [routesOpen, setRoutesOpen] = useState(false);
  const [advisories, setAdvisories] = useState([]);

  const osmLayer = new TileLayer({
    source: new OSM(),
  });
  osmLayer.setZIndex(400);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "pin",
      drop: (item, monitor) => {
        const { x, y } = monitor.getClientOffset();
        const { lat, lng } = mapRef.current.unproject([x, y - 48]);
        if (item.role === "start") {
          start.setLngLat([lng, lat]).addTo(mapRef.current);
        } else {
          end.setLngLat([lng, lat]).addTo(mapRef.current);
        }
      },
    }),
    []
  );

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
        visible: false,
        source: new ImageWMS({
          url: "https://dev-maps.th.gov.bc.ca/geoV05/hwy/wms",
          serverType: "geoserver",
          params: {
            LAYERS: "hwy:DSA_CONTRACT_AREA",
          },
          transition: 0,
        }),
      }),
      tid: Date.now(),



      open511Layer: new ImageLayer({
        className: "open511",
        type: "overlay",
        visible: false,
        source: new ImageWMS({
          url: "https://dev-maps.th.gov.bc.ca/geoV05/op5/wms",
          params: {
            LAYERS: "op5:OP5_EVENT511_ACTIVE_V",
          },
          serverType: "geoserver",
          transition: 0,
        }),
      }),
    };

    mapView.current = new View({
      projection: "EPSG:3857",
      constrainResolution: true,
      center: fromLonLat([lng, lat]),
      zoom: 9,
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
      controls: [],
    });

    // initialize event and webcam popup
    var popup = new Popup();
    mapRef.current.addOverlay(popup);

    mapRef.current.once("loadend", async () => {
      const { webcamData } = await getWebcams();
      const evpoints = await getEvents();
      layers.current["webcamsLayer"] = new VectorLayer({
        classname: "webcams",
        visible: true,
        source: new Cluster({
          distance: 35,
          source: new VectorSource({
            format: new GeoJSON(),
            loader: function (extent, resolution, projection) {
              var vectorSource = this;
              vectorSource.clear();
              if (webcamData) {
                webcamData.forEach((feature) => {
                  //Build a new OpenLayers feature
                  var olGeometry = new Point([
                    feature.properties.coords.lng,
                    feature.properties.coords.lat,
                  ]);
                  var olFeature = new ol.Feature({ geometry: olGeometry });

                  //Transfer properties
                  var properties = {};
                  properties["id"] = feature.id;
                  properties["name"] = feature.properties.name;
                  properties["description"] = feature.properties.caption;
                  properties["image_url"] =
                    "https://images.drivebc.ca/bchighwaycam/pub/cameras/" +
                    feature.id +
                    ".jpg";
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
            src: videoIcon,
          }),
        }),
      });

      mapRef.current.addLayer(layers.current["webcamsLayer"]);

      layers.current["eventsLayer"] = new VectorLayer({
        classname: "events",
        visible: true,
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
                  properties["headline"] = feature.properties.headline;
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
            const feature = clickedFeatures[0].values_.features[0].values_;
            iconClicked = true;
            popup.show(
              coordinate,
              `<div style='text-align: left; padding: 1rem'>
             <h4>${feature.name}</h4>
             <img src="${feature.image_url}" width='300'>
            <p>${feature.description}</p>
             </div>`
            );
            iconClicked = true;
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
        if(!iconClicked){
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

  function myLocation() {
    if (!mapRef.current) {
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      mapRef.current.setZoom(14);
      mapRef.current.setCenter(pos);
    });
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
  }

  function transformFeature(feature, sourceCRS, targetCRS) {
    var clone = feature.clone();
    clone.getGeometry().transform(sourceCRS, targetCRS);
    return clone;
  }

  function routeHandler(email) {
    /* FIXME: We're using window.start/end everywhere for now because of odd scoping
     * interactions between lexical start/end and the resulting marker in the map.  Despite
     * the fact that all instances in Map.js should be the declared instances above, we
     * would frequently see that start/end here have no lat/lng (while verifying in the
     * console that they do).  In particular, the addition of setInterval above for travel
     * advisories would cause the local references to find empty markers and fail to
     * find a route.  Even without that enabled, starting with the routes dialog closed
     * would cause the same failure.  Using window as an authoritative global scope seems
     * to fix this, but the proper solution would likely rely more upon using a maplibre
     * map layer to hold the pins.
     */
    if (!window.start.getLngLat() || !window.end.getLngLat()) {
      console.log("start or end not set");
      console.log(start.getLngLat());
      console.log(end.getLngLat());
      return;
    }

    if (!email) {
      email = "test@oxd.com";
    }

    fetch("http://localhost:8000/api/routes/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: "Primary route",
        start_location: window.start.getLngLat(),
        destination: window.end.getLngLat(),
      }),
    })
      .then((response) => {
        if (response.status === 201) {
          return response.json();
        } else {
          alert("Unable to calculate route. Please try again.");
        }
      })
      .then((data) => {
        if (data) {
          mapRef.current.getSource("routed").setData(data);
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Unable to calculate route. Please try again.");
      });
  }

  return (
    <div className="map-wrap" style={{ opacity: isOver ? 0.5 : 1 }} ref={drop}>
      <div ref={mapElement} className="map" />
      <div className="map-control">
        <Button variant="outline-primary"
          className="my-location"
          onClick={myLocation}
        >
          <FontAwesomeIcon icon={faLocationArrow} />
        </Button>
        <Button variant="outline-primary"
          className="zoom-in" onClick={zoomIn}>
          <FontAwesomeIcon icon={faPlus} />
        </Button>
        <Button variant="outline-primary"
          className="zoom-out" onClick={zoomOut}>
          <FontAwesomeIcon icon={faMinus} />
        </Button>
      </div>

      <Routes
        open={routesOpen}
        setRoutesOpen={toggleRoutes}
        setStartToLocation={setStartToLocation}
        routeHandler={routeHandler}
      />

      <Layers
        open={layersOpen}
        setLayersOpen={toggleLayers}
        toggleLayer={toggleLayer}
      />

      {advisories.length > 0 ? <Advisory advisories={advisories} /> : null}
    </div>
  );
}
