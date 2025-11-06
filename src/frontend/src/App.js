// React
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';

// Navigation
import { Route, Routes, useSearchParams } from 'react-router-dom';

// Redux
import { memoize } from "proxy-memoize";
import { useDispatch, useSelector } from 'react-redux';
import { updateFavCams, updateFavRoutes } from './slices/userSlice';
import { updateAreas } from './slices/feedsSlice';
import { updateSearchedRoutes, updateSearchLocationFrom, updateSearchLocationTo } from "./slices";

// External imports
// https://github.com/dai-shi/proxy-memoize?tab=readme-ov-file#usage-with-immer
import { setAutoFreeze } from 'immer';
setAutoFreeze(false);

// Styling
import '@bcgov/bc-sans/css/BCSans.css';
import './App.scss';

// Internal imports
import { getAreas } from "./Components/data/areas";
import { getFavoriteCameraIds } from './Components/data/webcams';
import { getFavoriteRoutes, linkRoute } from './Components/data/routes';
import { getLocations } from "./Components/data/locations";
import AccountPage from './pages/AccountPage';
import AccountDeactivatedPage from "./pages/AccountDeactivatedPage";
import AdvisoriesListPage from './pages/AdvisoriesListPage';
import AdvisoryDetailsPage from './pages/AdvisoryDetailsPage';
import Alert from './Components/shared/Alert';
import BulletinDetailsPage from './pages/BulletinDetailsPage';
import BulletinsListPage from './pages/BulletinsListPage';
import CameraDetailsPage from './pages/CameraDetailsPage';
import CamerasListPage from './pages/CamerasListPage';
import EventsListPage from './pages/EventsListPage';
import FeedbackPage from './pages/FeedbackPage';
import EmergencyAlert from "./Components/shared/EmergencyAlert.js";
import Header from './Components/shared/header/Header.js';
import MapPage from './pages/MapPage';
import AuthModal from './AuthModal.js';
// import ConsentModal from "./ConsentModal";
import NotFoundPage from './pages/NotFoundPage';
import ProblemsPage from './pages/ProblemsPage.js';
import ReportElectricalPage from './pages/ReportElectricalPage';
import ReportRoadPage from './pages/ReportRoadPage';
import SavedCamerasPage from './pages/SavedCamerasPage';
import SavedRoutesPage from './pages/SavedRoutesPage';
import ScrollToTop from './Components/shared/ScrollToTop';
import Survey from "./Components/shared/Survey";

// FontAwesome Stylesheet
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import VerifyEmailPage from "./pages/VerifyEmailPage";
config.autoAddCss = false

// Variables
export const AlertContext = createContext();
export const AuthContext = createContext(null);
export const CamsContext = createContext(null);
export const CMSContext = createContext();
export const EmergencyAlertContext = createContext();
export const MapContext = createContext(null);
// export const HeaderHeightContext = createContext();
export const FeatureContext = createContext({});
export const FilterContext = createContext({});

let callingSession = false;
let sessionStateKnown = false;

function App() {
  /* Setup */
  // Redux
  const dispatch = useDispatch();
  const { selectedRoute, searchedRoutes, areas } = useSelector(useCallback(memoize(state => ({
    selectedRoute: state.routes.selectedRoute,
    searchedRoutes: state.routes.searchedRoutes,
    areas: state.feeds.areas.list,
  }))));

  // Routing
  const [searchParams, _setSearchParams] = useSearchParams();

  // Refs
  const isInitialAlertMount = useRef(true);
  const timeout = useRef();

  // States
  const [alertMessage, setAlertMessage] = useState();
  const [authContext, setAuthContext] = useState(getInitialAuthContext());
  const [camsContext, setCamsContext] = useState({ displayLength: 21, setDisplayLength: (length) => {} });
  const [cmsContext, setCMSContext] = useState(getInitialCMSContext());
  const [emergencyAlertContext, setEmergencyAlertContext] = useState(getInitialEmergencyAlertContext());
  const [mapContext, setMapContext] = useState(getInitialMapContext());
  // const [headerHeightContext, setHeaderHeightContext] = useState();
  const [featureContext, setFeatureContext] = useState({});
  const [filterContext, setFilterContext] = useState({});
  // const [showConsentModal, setShowConsentModal] = useState(false);

  // Effects
  useEffect(() => {
    if (isInitialAlertMount.current) {
      isInitialAlertMount.current = false;
      return;
    }

    if (alertMessage) {
      // Clear existing close alert timers
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      // Set new close alert timer to reference
      timeout.current = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
    }

  }, [alertMessage]);

  useEffect(() => {
    // Do nothing if login state is not known
    if (!authContext.loginStateKnown) {
      return
    }

    // Authenticated user
    if (authContext.username) {
      initCams();
      initRoutes();

      // if (!authContext.consent && !authContext.attempted_consent) {
      //   setShowConsentModal(true);
      // }
    }
  }, [authContext]);

  // Populate location based on shared search params
  const initializeSearchLocation = (action) => {
    const locationText = searchParams.get((action === updateSearchLocationFrom ? 'start' : 'end'));

    if (locationText) {
      if (locationText === 'null') {
        dispatch(action([]));

      } else {
        getLocations(locationText).then(locationsData => {  // Fetch locations from text
          for (let i=0; i < locationsData.features.length; i++) {
            const feature = locationsData.features[i];
            if (feature.properties.fullAddress === locationText) {  // Dispatch exact match
              dispatch(action([{
                ...feature,
                label: feature.properties.fullAddress,
              }]));
              break;
            }
          }
        });
      }
    }
  }

  useEffect(async () => {
    if (!areas) {
      const areaData = await getAreas();
      dispatch(updateAreas({ list: areaData }));
    }

    initializeSearchLocation(updateSearchLocationFrom)
    initializeSearchLocation(updateSearchLocationTo)
  }, []);

  /* Helpers */
  // Data functions
  function getInitialCMSContext() {
    const context = localStorage.getItem('cmsContext');
    return context ? JSON.parse(context) : {
      readAdvisories: [],
      readBulletins: [],
    };
  }

  function getInitialEmergencyAlertContext() {
    const context = localStorage.getItem('emergencyAlertContext');
    return context ? JSON.parse(context) : [];
  }

  function getInitialMapContext() {
    const context = localStorage.getItem('mapContext');
    return context ? JSON.parse(context) : {
      visible_layers: {
        closures: true,
        majorEvents: true,
        minorEvents: false,
        futureEvents: false,
        roadConditions: true,
        highwayCams: false,
        inlandFerries: true,
        weather: false,
        restStops: false,
        largeRestStops: false,
        chainUps: false,
        wildfires: false,
      },
    };
  }

  function getInitialAuthContext() {
    if (!sessionStateKnown && !callingSession) {
      callingSession = true;

      fetch(`${window.API_HOST}/api/session`, {
        headers: { 'Accept': 'application/json' },
        credentials: "include",
      }).then((response) => response.json())
        .then((data) => {
          const ret = {
            loginStateKnown: true,
          };
          sessionStateKnown = true;
          if (data.username) {
            ret.username = data.username;
            ret.email = data.email;
            ret.verified = data.verified;
            ret.attempted_verification = data.attempted_verification;
            ret.consent = data.consent;
            ret.attempted_consent = data.attempted_consent;
          }
          setAuthContext((prior) => {
            if (ret.loginStateKnown != prior.loginStateKnown) { return ret; }
            if (ret.username != prior.username) { return ret; }
            if (ret.email != prior.email) { return ret; }
            if (ret.verified != prior.verified) { return ret; }
            if (ret.attempted_verification != prior.attempted_verification) { return ret; }
            return prior;
          });
        })
        .finally(() => {
          callingSession = false;
        });
    }

    return { loginStateKnown: false }
  }

  const initCams = async () => {
    // Get saved cam ids and map into a list of integers
    const favCamsData = await getFavoriteCameraIds();
    const favCamIds = favCamsData.map(webcam => webcam.webcam);
    dispatch(updateFavCams(favCamIds));
  }

  const initRoutes = async () => {
    const favRoutesData = await getFavoriteRoutes();
    dispatch(updateFavRoutes(favRoutesData));

    // link existing selected route with fav routes
    if (selectedRoute) {
      linkRoute(selectedRoute, favRoutesData);
    }

    // link existing searched routes with fav routes
    if (searchedRoutes) {
      searchedRoutes.forEach((route) => {
        linkRoute(route, favRoutesData);
      });

      dispatch(updateSearchedRoutes(searchedRoutes));
    }
  }

  /* Rendering */
  // Main component
  return (
    <AuthContext.Provider value={{ authContext, setAuthContext }}>
      <MapContext.Provider value={{ mapContext, setMapContext }}>
        <CamsContext.Provider value={{ camsContext, setCamsContext }}>
          <AlertContext.Provider value={{ alertMessage, setAlertMessage }}>
            <CMSContext.Provider value={{ cmsContext, setCMSContext }}>
              <EmergencyAlertContext.Provider value={{ emergencyAlertContext, setEmergencyAlertContext }}>
                  <FeatureContext.Provider value={{ featureContext, setFeatureContext }}>
                    <FilterContext.Provider value={{ filterContext, setFilterContext }}>
                      <div className="App">
                        <Header />

                        <EmergencyAlert />

                        <main id='main'>

                          <ScrollToTop />

                          <Routes>
                            <Route path="/" element={<MapPage />} />
                            <Route path="/my-cameras" element={<SavedCamerasPage />} />
                            <Route path="/my-routes" element={<SavedRoutesPage />} />
                            <Route path="/cameras" element={<CamerasListPage />} />
                            <Route path="/cameras/:id" element={<CameraDetailsPage />} />
                            <Route path="/delays" element={<EventsListPage />} />
                            <Route path="/advisories" element={<AdvisoriesListPage />} />
                            <Route path="/advisories/:id/:subid?" element={<AdvisoryDetailsPage />} />
                            <Route path="/bulletins" element={<BulletinsListPage />} />
                            <Route path="/bulletins/:id/:subid?" element={<BulletinDetailsPage />} />
                            <Route path="/account" element={<AccountPage />} />
                            <Route path="/account-deactivated" element={<AccountDeactivatedPage />} />
                            <Route path="/feedback" element={<FeedbackPage />} />
                            <Route path="/verify-email" element={<VerifyEmailPage />} />
                            {/* Catch-all route for 404 errors */}
                            <Route path="*" element={<NotFoundPage />} />
                            <Route path="/problems" element={<ProblemsPage />} />
                            <Route path="/website-problem" element={<div>Website Problem or Suggestion Page</div>} />
                            <Route path="/highway-problem" element={<ReportRoadPage />} />
                            <Route path="/road-electrical-problem" element={<ReportElectricalPage />} />
                          </Routes>

                        </main>

                        <AuthModal />

                        <Alert alertMessage={alertMessage} closeAlert={() => setAlertMessage(null)} />

                        <Survey />
                      </div>
                    </FilterContext.Provider>
                  </FeatureContext.Provider>
              </EmergencyAlertContext.Provider>
            </CMSContext.Provider>
          </AlertContext.Provider>
        </CamsContext.Provider>
      </MapContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
