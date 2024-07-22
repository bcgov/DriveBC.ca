// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// External imports
import Container from 'react-bootstrap/Container';

// Internal imports
import { AuthContext } from '../App';
import { collator, getCameras, addCameraGroups } from '../Components/data/webcams';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import CameraList from '../Components/cameras/CameraList';
import Footer from '../Footer';
import PageHeader from '../PageHeader';

// Styling
import './SavedCamerasPage.scss';

export default function SavedCamerasPage() {
  document.title = 'DriveBC - My Cameras';

  const { authContext } = useContext(AuthContext);

  const navigate = useNavigate();

  // Redux
  const { cameras, favCams } = useSelector(useCallback(memoize(state => ({
    cameras: state.feeds.cameras.list,
    favCams: state.user.favCams
  }))));

  // UseRef hooks
  const isInitialMount = useRef(true);

  // UseState hooks
  const [processedCameras, setProcessedCameras] = useState(null);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  // Data functions
  const getSavedCameras = async () => {
    // Fetch data if it doesn't already exist
    const camData = cameras ? cameras : await getCameras().catch((error) => displayError(error));

    // Get fav group IDs from saved cams
    const filteredFavCams = camData.filter(item => favCams.includes(item.id));
    const favCamGroupIds = filteredFavCams.map(cam => cam.group);

    // Filter cameras by fav group IDs
    const filteredCameras = camData.filter(cam => favCamGroupIds.includes(cam.group));

    // Filter cameras by user's saved cameras
    if (filteredCameras) {
      // Deep clone and add group reference to each cam
      const clonedCameras = JSON.parse(JSON.stringify(filteredCameras));
      const finalCameras = addCameraGroups(clonedCameras, favCams);

      // Sort cameras by highway number and route_order
      finalCameras.sort(function(a, b) {
        // Sort by highway first, then default highway/route order
        const highwayCompare = collator.compare(a.highway_display, b.highway_display);
        if (highwayCompare == 0) {
          return collator.compare(a.route_order, b.route_order);
        }

        return highwayCompare;
      });

      setProcessedCameras(finalCameras);
    }
  };

  // useEffect hooks
  // Redirect to login page if user is not logged in
  useEffect(() => {
    if (!authContext.loginStateKnown) {
      return;
    }

    if (!authContext.username) {
      navigate('/');
      return;
    }

    getSavedCameras();
  }, [authContext]);

  useEffect(() => {
    // Do not run on initial mount, it will run on authContext update
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    getSavedCameras();
  }, [favCams]);

  // Rendering
  return (
    <div className="saved-cameras-page">
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

      <PageHeader
        title="My cameras"
        description="Manage and view your saved cameras here.">
      </PageHeader>

      <Container>
        <CameraList cameras={ processedCameras ? processedCameras : [] }></CameraList>

        {!(processedCameras && processedCameras.length) &&
          <div className="empty-cam-display">
            <h2>No cameras to display</h2>

            <h6><b>Have you entered search terms to narrow down the list?</b></h6>
            <p>Try checking your spelling, changing, or removing your search terms.</p>
          </div>
        }
      </Container>

      <Footer />
    </div>
  );
}
