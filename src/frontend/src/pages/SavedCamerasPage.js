// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// External imports
import Container from 'react-bootstrap/Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarOutline } from '@fortawesome/pro-regular-svg-icons';

// Internal imports
import { AuthContext } from '../App';
import { collator, getCameras, addCameraGroups } from '../Components/data/webcams';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import CameraList from '../Components/cameras/CameraList';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import Alert from '../Components/shared/Alert';

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
  const timeout = useRef();

  // UseState hooks
  const [processedCameras, setProcessedCameras] = useState(null);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [alertStatus, setAlertStatus] = useState(false);

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

  const handleShowAlertChange = (value) => {
    setAlertStatus(value);
    console.log('Alert status updated:', value);
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => {
      setAlertStatus(false);
    }, 5000);

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

  const getAlertMessage = () => {
    return <p>{'Removed from '} <a href="/my-cameras">My cameras</a></p>;
  };

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
        <CameraList
          cameras={ processedCameras ? processedCameras : [] }
          getCheckedHighway={()=>{}}
          onShowAlertChange={handleShowAlertChange}
        />

        {!(processedCameras && processedCameras.length) &&
          <div className="empty-cam-display">
            <h3>No saved cameras</h3>

            <p>
              You don&apos;t have any saved cameras yet. You can add a saved camera from the <Link to="/" className="link-in-text">map</Link>, the <Link className="link-in-text" to="/cameras">camera list</Link>, or each camera&apos;s detail page by clicking the save camera button &#40;<FontAwesomeIcon icon={faStarOutline} />&#41;.
            </p>
          </div>
        }
        <Alert showAlert={alertStatus} setShowAlert={setAlertStatus} message={getAlertMessage()} />
      </Container>

      <Footer />
    </div>
  );
}
