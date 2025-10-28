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
import { faVideoSlash, faVideo, faStar, faCircleInfo, faXmark, faChevronRight, faArrowsRotate } from '@fortawesome/pro-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";
import Button from 'react-bootstrap/Button';
import parse from 'html-react-parser';

// Internal imports
import { AlertContext, AuthContext } from '../../../App';
import { addFavoriteCamera, deleteFavoriteCamera, getCameras } from "../../data/webcams";
import { getCameraOrientation } from '../../cameras/helper';
import FriendlyTime from '../../shared/FriendlyTime';
import trackEvent from '../../shared/TrackEvent';
import ShareURLButton from '../../shared/ShareURLButton';
import PollingComponent from '../../shared/PollingComponent';

// Static assets
import colocatedCamIcon from '../../../images/colocated-camera.svg';

// Styling
import './CamPanel.scss';


// Main component
export default function CamPanel(props) {
  /* Setup */
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  // Props
  const { camFeature, isCamDetail, showRouteObjs } = props;
  const newCam = camFeature.id ? camFeature : camFeature.getProperties();

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);

  // Navigation
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux
  const dispatch = useDispatch();
  const { favCams } = useSelector(useCallback(memoize(state => ({
    favCams: state.user.favCams
  }))));

  // Refs
  const isInitialMount = useRef(true);
  const camPanelRef = useRef(null);
  const rootCamRef = useRef(newCam);

  // States
  const [camera, setCamera] = useState(newCam);
  const [camIndex, setCamIndex] = useState(0);
  const [show, setShow] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUpdated, setIsUpdated] = useState(false);

  // Effects
  useEffect(() => {
    const newCam = camFeature.id ? camFeature : camFeature.getProperties();
    rootCamRef.current = newCam;
    setCamera(newCam);
    const params = new URLSearchParams(window.location.search);
    const savedCamIndex = params.get('camIndex') === null ? 0: params.get('camIndex');
    setCamIndex(savedCamIndex);

    searchParams.set("type", 'camera');
    searchParams.set("id", newCam.id);
    searchParams.delete("display_category");
    setSearchParams(searchParams, { replace: true });
  }, [camFeature]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCamera(rootCamRef.current.camGroup[camIndex]);

    searchParams.set("camIndex", camIndex);
    setSearchParams(searchParams, { replace: true });

    // need to track camIndex as a data attribute to bypass lexical binding
    // of camIndex in helper functions (i.e., updateCamera);
    camPanelRef.current.setAttribute('data-current', camIndex);
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

  const updateCamera = () => {
    rootCamRef.current.camGroup.forEach((cam, ii) => {
      getCameras(
        null,
        `${window.API_HOST}/api/webcams/${cam.id}/`,
      ).then((update) => {
        if (update.last_update_modified !== cam.last_update_modified) {
          // using data attribute avoids lexical binding of camIndex state that
          // locks it at the initial value
          const currentCamIndex = camPanelRef.current.getAttribute('data-current');
          rootCamRef.current.camGroup[ii] = update;
          if (ii == currentCamIndex) {
            setCamera(rootCamRef.current.camGroup[ii]);
            setIsUpdated(true);
          }
        }
      }).catch(error => console.log(error));
    })
  }

  const getCamLink = (cam) => {
    return `${cam.links.imageDisplay}?ts=${encodeURIComponent(cam.last_update_modified)}`
  }

  /* Handlers */
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
      toggleAuthModal('Sign in');
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

    const res = Object.entries(rootCamRef.current.camGroup).map(([index, cam]) => {
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
    <div className="popup popup--camera" ref={camPanelRef} data-current="0">
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="22" height="22" rx="11" fill="white"/>
            <rect x="1" y="1" width="22" height="22" rx="11" stroke="#255A90" strokeWidth="2"/>
            <path d="M6 9.125C6 8.37305 6.60156 7.75 7.375 7.75H12.875C13.627 7.75 14.25 8.37305 14.25 9.125V14.625C14.25 15.3984 13.627 16 12.875 16H7.375C6.60156 16 6 15.3984 6 14.625V9.125ZM18.0098 8.52344C18.2246 8.65234 18.375 8.88867 18.375 9.125V14.625C18.375 14.8828 18.2246 15.1191 18.0098 15.248C17.7734 15.3555 17.5156 15.3555 17.3008 15.2051L15.2383 13.8301L14.9375 13.6367V13.25V10.5V10.1348L15.2383 9.94141L17.3008 8.56641C17.5156 8.41602 17.7734 8.41602 18.0098 8.52344Z" fill="#255A90"/>
          </svg>
          <p className="name">Camera</p>
        </div>
        <ShareURLButton/>
      </div>

      {camera && (
        <div className="popup__content">
          <div className="popup__content__title">
            <p
              className="name"
              onClick={handlePopupClick}
              onKeyDown={keyEvent => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  handlePopupClick();
                }
              }}
              tabIndex={0}>
              {camera.name}
            </p>
          </div>

          <div className="popup__content__description">
            <p>{parse(camera.caption)}</p>
          </div>

          <div className="camera-orientations">
            <div
              className="rotate-cam-container"
              tabIndex={0}
              onClick={handleCameraImageClick}
              onKeyDown={(keyEvent) => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  handleCameraImageClick(keyEvent);
                }
              }}>

              <img
                src={colocatedCamIcon}
                role="presentation"
                alt="colocated cameras icon"/>

              <span>Direction</span>
            </div>

            {renderCamGroup()}
          </div>

          {camera.is_on ? (
            <div className="popup__content__image"
              onClick={handlePopupClick}
              onKeyDown={keyEvent => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  handlePopupClick();
                }
              }}
              tabIndex={0}
            >
              <div className="clip">
                {isUpdated && (
                  <div className="card-notification updated">
                    <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                      <FontAwesomeIcon icon={faArrowsRotate} />
                      <p>Image automatically updated to show the latest image received.</p>
                      <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                    </div>
                    <div className={'card-pill' + (show ? ' bounce' : ' hidden')}
                      onClick={handleChildClick}
                      onKeyDown={keyEvent => {
                        if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                          handleChildClick();
                        }
                      }}>
                      <p>Updated</p>
                      <FontAwesomeIcon icon={faCircleInfo} />
                    </div>
                  </div>
                )}

                <img src={getCamLink(camera)} width="300" />

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
                        if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
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
          ) : (
            <div
              className="popup__content__image"
              onClick={handlePopupClick}
              onKeyDown={keyEvent => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  handlePopupClick();
                }
              }} tabIndex={0}>

              <div className="camera-unavailable">
                <div className="card-pill">
                  <p>Unavailable</p>
                </div>

                <div className="card-img-box unavailable">
                  <FontAwesomeIcon icon={faVideoSlash}/>
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
              </div>
            </div>
          )}

          <div className="popup__content__tools">
            <p
              className="view-details"
              onClick={handlePopupClick}
              onKeyDown={keyEvent => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
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

          <PollingComponent runnable={updateCamera} interval={5000} />

        </div>
      )}
    </div>
  );
}
