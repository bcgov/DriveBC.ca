// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { pushFavCam, removeFavCam, updatePendingAction } from '../../../slices/userSlice';

// Navigation
import { useNavigate, useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideoSlash, faVideo, faStar, faCircleInfo, faXmark, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/pro-regular-svg-icons';
import Button from 'react-bootstrap/Button';
import parse from 'html-react-parser';

// Internal imports
import { AlertContext, AuthContext } from '../../../App';
import { addFavoriteCamera, deleteFavoriteCamera } from "../../data/webcams";
import { getCameraOrientation } from '../../cameras/helper';
import FriendlyTime from '../../shared/FriendlyTime';
import trackEvent from '../../shared/TrackEvent';
import ShareURLButton from '../../shared/ShareURLButton';
import { getCameras } from '../../data/webcams';

// Static assets
import colocatedCamIcon from '../../../images/colocated-camera.svg';

// Styling
import './CamPanel.scss';

// Main component
export default function CamPanel(props) {
  /* Setup */
  // Props
  const { camFeature, isCamDetail } = props;

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);

  // Navigation
  const navigate = useNavigate();
  const [_searchParams, setSearchParams] = useSearchParams();

  // Redux
  const dispatch = useDispatch();
  const { favCams } = useSelector(useCallback(memoize(state => ({
    favCams: state.user.favCams
  }))));

  // Refs
  const isInitialMount = useRef(true);

  // States
  const newCam = camFeature.id ? camFeature : camFeature.getProperties();
  const [rootCam, setRootCam] = useState(newCam);
  const [camera, setCamera] = useState(newCam);
  const [camIndex, setCamIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);
  const [imageSrc, setImageSrc] = useState(camera.links.imageDisplay);
  const [imageLastUpdateModified, setImageLastUpdateModified] = useState(camera.last_update_modified);
  const handleCameraImageClick = (event) => {
    const container = event.currentTarget.closest(".camera-orientations");
    const buttons = container.querySelectorAll(".camera-direction-btn");
    let currentIndex = Array.from(buttons).findIndex(
      (button) => button.classList.contains("current")
    );
    if (currentIndex === -1) {
      currentIndex = activeIndex;
    }
    const nextIndex = (currentIndex + 1) % buttons.length;
    buttons[nextIndex].focus();
    setActiveIndex(nextIndex);
    const nextCamera = camera.camGroup[nextIndex];
    setCamera(nextCamera);
    trackEvent("click", "camera-list", "camera", nextCamera.name);
  };

  const updateCamera = async () => {
    const camData = await getCameras(
      null,
      `${window.API_HOST}/api/webcams/${camFeature.id_}/`);
    if (camData && camFeature) {
      if (camData.last_update_modified !== camera.last_update_modified) {
        if(!camFeature.updated) {
          return;
        }
        setIsUpdated(true);
        updateCameraImage(camData);
        setImageLastUpdateModified(camData.last_update_modified);
        setCamera(camData);
        const timer = setTimeout(() => {
          setCamera(camData);
          setIsUpdated(false);
        }, 10000);
    
        clearTimeout(timer);
      }
      else {
        setTimeout(() => {
          setIsUpdated(false);
        }, 10000);
      }
      return;
    }
  }

  const updateCameraImage = (cam) => {
    const newImage = `${cam.links.imageDisplay}?ts=${new Date(cam.last_update_modified).getTime()}`;
    setImageSrc(newImage);
  }

  useEffect(() => {
    updateCamera();    
  });

  // Effects
  useEffect(() => {
    const newCam = camFeature.id ? camFeature : camFeature.getProperties();
    setRootCam(newCam);
    setCamera(newCam);
    const params = new URLSearchParams(window.location.search);
    const savedCamIndex = params.get('camIndex') === null ? 0: params.get('camIndex');
    setCamIndex(savedCamIndex);

    setSearchParams(new URLSearchParams({ type: 'camera', id: newCam.id }));
  }, [camFeature]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCamera(rootCam.camGroup[camIndex]);
    _searchParams.set("camIndex", camIndex);
    setSearchParams(_searchParams);
  }, [camIndex]);

  /* Helpers */
  const toggleAuthModal = (action) => {
    setAuthContext((prior) => {
      if (!prior.showingModal) {
        return { ...prior, showingModal: true, action };
      }
      return prior;
    })
  };

  /* Handlers */
  const handlePopupClick = e => {
    if (!isCamDetail) {
      navigate(`/cameras/${camera.id}`);
    }
  };

  function handleChildClick(e) {
    e.stopPropagation();
    setShow(!show);
  }

  const favoriteHandler = () => {
    // User logged in, default handler
    if (favCams && authContext.loginStateKnown && authContext.username) {
      if (favCams.includes(camera.id)) {
        deleteFavoriteCamera(camera.id, dispatch, removeFavCam);
        setAlertMessage(<p>Removed from <a href="/my-cameras">My cameras</a></p>);

      } else {
        addFavoriteCamera(camera.id, dispatch, pushFavCam);
        setAlertMessage(<p>Saved to <a href="/my-cameras">My cameras</a></p>);
      }

    // User not logged in, save pending action and open login modal
    } else {
      toggleAuthModal('Sign In');
      dispatch(updatePendingAction({
        action: 'pushFavCam',
        payload: camera.id,
      }));
    }
  }

  /* Rendering */
  // Subcomponents
  function renderCamGroup(currentCamData) {
    const clickHandler = i => {
      setCamIndex(i); // Trigger re-render
    };

    const res = Object.entries(rootCam.camGroup).map(([index, cam]) => {
      return (
        <Button
          aria-label={getCameraOrientation(cam.orientation)}
          className={
            'camera-direction-btn' +
            (camera.id === cam.id ? ' current' : '')
          }
          key={cam.id}
          onClick={event => {
            trackEvent('click', 'map', 'camera', cam.name);
            event.stopPropagation();
            clickHandler(index);
          }}>

          {cam.orientation}
        </Button>
      );
    });

    return res;
  }

  // Main component
  return (
    <div className="popup popup--camera">
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faVideo} />
        </div>

        <div className="popup__title__name">
          <p className="name">Camera</p>
          <ShareURLButton />
        </div>
      </div>

      {camera && (
        <div className="popup__content">
          <div className="popup__content__title">
            <p
              className="name"
              onClick={handlePopupClick}
              onKeyDown={keyEvent => {
                if (keyEvent.keyCode == 13) {
                  handlePopupClick();
                }
              }}
              tabIndex={0}>
              {camera.name}
            </p>
          </div>

          {camera.is_on ? (
            <div className="popup__content__image"
              onClick={handlePopupClick}
              onKeyDown={keyEvent => {
                if (keyEvent.keyCode == 13) {
                  handlePopupClick();
                }
              }}
              tabIndex={0}
            >
              <div className="clip">
                {/* <img src={camera.links.imageDisplay} width="300" /> */}
                <img src={imageSrc} width="300" />

                {camera.marked_delayed && camera.marked_stale && (
                  <>
                    <div className="card-notification">
                      <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                        <p>
                          Longer than expected delay, displaying last image received.
                        </p>
                        <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                      </div>
                    </div>

                    <div
                      className={'card-pill' + (show ? ' bounce' : ' hidden')}
                      onClick={handleChildClick}
                      onKeyDown={keyEvent => {
                        if (keyEvent.keyCode === 13) {
                          handleChildClick();
                        }
                      }}
                      tabIndex="0"
                    >
                      <p>Delayed</p>
                      <FontAwesomeIcon icon={faCircleInfo} />
                    </div>
                  </>
                )}

                {isUpdated && (
                  <div className="card-notification">              
                  <>
                    <div
                      className={'card-pill' + (show ? ' hidden' : ' bounce updated')}
                      onKeyDown={keyEvent => {
                        if (keyEvent.keyCode === 13) {
                          handleChildClick();
                        }
                      }}>
                      <p>Updated</p>
                      <FontAwesomeIcon icon={faCircleInfo} />
                    </div>
                  </>
              </div>
                )}
              </div>

              <div className="timestamp">
                <p className="driveBC">
                  Drive<span>BC</span>
                </p>

                <FriendlyTime
                  date={imageLastUpdateModified}
                  asDate={true} />
              </div>
            </div>
          ) : (
            <div className="popup__content__image">
              <div className="camera-unavailable">
                <div className="card-pill">
                  <p>Unavailable</p>
                </div>

                <div className="card-img-box unavailable">
                  <FontAwesomeIcon icon={faVideoSlash} />
                </div>

                <p>
                  This camera image is temporarily unavailable. Please check
                  again later.
                </p>
              </div>

              <div className="timestamp">
                <p className="driveBC">
                  Drive<span>BC</span>
                </p>

                <FriendlyTime
                  date={camera.last_update_modified}
                  asDate={true} />
              </div>
            </div>
          )}

          <div className="camera-orientations">
            <img
              // ref={imageRef}
              className="colocated-camera-icon"
              src={colocatedCamIcon}
              // src={imageSrc}
              role="presentation"
              alt="colocated cameras icon" 
              onClick={handleCameraImageClick}
              style={{ cursor: "pointer" }}
              />

            {renderCamGroup()}
          </div>

          <div className="popup__content__description">
            <p>{parse(camera.caption)}</p>
          </div>

          <div className="popup__content__tools">
            <p
              className="view-details"
              onClick={handlePopupClick}
              onKeyDown={keyEvent => {
                if (keyEvent.keyCode == 13) {
                  handlePopupClick();
                }
              }}
              tabIndex={0}>
              View details
              <FontAwesomeIcon icon={faChevronRight} />
            </p>

            {authContext.loginStateKnown &&
              <button
                className={`favourite-btn btn-tertiary ${(favCams && favCams.includes(camera.id)) ? 'favourited' : ''}`}
                aria-label={`${(favCams && favCams.includes(camera.id)) ? 'Remove favourite' : 'Add favourite'}`}
                onClick={favoriteHandler}>

                {(favCams && favCams.includes(camera.id)) ?
                  (<React.Fragment><FontAwesomeIcon icon={faStar} /><span>Remove</span></React.Fragment>) :
                  (<React.Fragment><FontAwesomeIcon icon={faStarOutline} /><span>Save</span></React.Fragment>)
                }
              </button>
            }
          </div>
        </div>
      )}
    </div>
  );
}