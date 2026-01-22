// React
import React, { lazy, Suspense } from 'react';
import Feature from "ol/Feature";

// Styling
import './index.scss';

// Lazy load all panels
const AdvisoriesPanel = lazy(() => import('./AdvisoriesPanel'));
const CamPanel = lazy(() => import('./CamPanel'));
const CoastalFerryPanel = lazy(() => import('./CoastalFerryPanel'));
const EventPanel = lazy(() => import('./EventPanel'));
const FerryPanel = lazy(() => import('./FerryPanel'));
const RestStopPanel = lazy(() => import('./RestStopPanel'));
const RouteDetailsPanel = lazy(() => import('./RouteDetailsPanel'));
const BorderCrossingPanel = lazy(() => import('./BorderCrossingPanel'));
const WildfirePanel = lazy(() => import('./WildfirePanel'));

// Lazy load weather panels as a single chunk
const WeatherPanels = lazy(() => import('./weather'));

// Loading fallback component
const PanelLoader = () => (
  <div className="panel-loader" style={{ padding: '20px', textAlign: 'center' }}>
    Loading...
  </div>
);

export const renderPanel = (
  clickedFeature,
  isCamDetail,
  smallScreen,
  mapView,
  clickedFeatureRef,
  updateClickedFeature,
  showRouteObjs,
  setShowRouteObjs
) => {
  const renderWithSuspense = (Component, props) => (
    <Suspense fallback={<PanelLoader />}>
      <Component {...props} />
    </Suspense>
  );

  if (clickedFeature) {
    // Hack for rendering advisories panel since it's not a feature
    // DBC22-2871: temporarily disabled
    // if (!clickedFeature.get) {
    //   return renderWithSuspense(AdvisoriesPanel, { 
    //     advisories: clickedFeature, 
    //     smallScreen, 
    //     mapView 
    //   });
    // }

    switch (clickedFeature.get('type')) {
      case 'camera':
        return renderWithSuspense(CamPanel, { 
          camFeature: clickedFeature, 
          isCamDetail, 
          showRouteObjs 
        });
      
      case 'event':
        return renderWithSuspense(EventPanel, { 
          feature: clickedFeature, 
          showRouteObjs 
        });
      
      case 'ferry':
        if (clickedFeature.get('coastal')) {
          return renderWithSuspense(CoastalFerryPanel, { 
            feature: clickedFeature, 
            showRouteObjs 
          });
        }
        return renderWithSuspense(FerryPanel, { 
          feature: clickedFeature, 
          showRouteObjs 
        });
      
      case 'currentWeather':
        return renderWithSuspense(WeatherPanels, { 
          type: 'local',
          feature: clickedFeature, 
          showRouteObjs 
        });
      
      case 'regionalWeather':
        return renderWithSuspense(WeatherPanels, { 
          type: 'regional',
          feature: clickedFeature, 
          showRouteObjs 
        });
      
      case 'hef':
        return renderWithSuspense(WeatherPanels, { 
          type: 'hef',
          feature: clickedFeature, 
          showRouteObjs 
        });
      
      case 'largeRestStop':
      case 'restStop':
        return renderWithSuspense(RestStopPanel, { 
          feature: clickedFeature, 
          showRouteObjs 
        });
      
      case 'borderCrossing':
        return renderWithSuspense(BorderCrossingPanel, { 
          borderCrossing: clickedFeature.getProperties(), 
          showRouteObjs 
        });
      
      case 'advisory':
        return renderWithSuspense(AdvisoriesPanel, { 
          advisories: clickedFeature.get('data'), 
          showRouteObjs, 
          inMap: true 
        });
      
      case 'wildfire':
        return renderWithSuspense(WildfirePanel, { 
          wildfire: clickedFeature.get('data'), 
          showRouteObjs 
        });
    }

  // Render searched routes panel if no feature is clicked
  } else {
    return renderWithSuspense(RouteDetailsPanel, {
      clickedFeatureRef,
      updateClickedFeature,
      showRouteObjs,
      setShowRouteObjs
    });
  }
}

export const resizePanel = (panelRef, clickedFeature, setMaximizedPanel) => {
  if (panelRef.current.classList.contains('open')){
    // Prevent maximizing advisory and route panels on mobile view
    if (clickedFeature instanceof Feature){
      if(!panelRef.current.classList.contains('maximized')) {
        panelRef.current.classList.add('maximized');
        setMaximizedPanel(true);

      } else {
        panelRef.current.classList.remove('maximized');
        setMaximizedPanel(false);
      }
    }
  }
}

export const togglePanel = (panelRef, resetClickedStates, clickedFeatureRef, updateClickedFeature, pushMargins, searchedRoutes) => {
  if (searchedRoutes) {
    panelRef.current.classList.remove('maximized');
    resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
    return;
  }

  panelRef.current.classList.toggle('open');
  panelRef.current.classList.remove('maximized');
  if (!panelRef.current.classList.contains('open')) {
    pushMargins.forEach((ref) => {
      if (ref.current) { ref.current.classList.remove('margin-pushed'); }
    })
    resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
  } else {
    pushMargins.forEach((ref) => {
      if (ref.current) { ref.current.classList.add('margin-pushed'); }
    })
  }
}
