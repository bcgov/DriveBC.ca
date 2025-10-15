// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { pushFavCam, removeFavCam, updatePendingAction } from '../../slices/userSlice';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faCircleInfo,
  faVideoSlash,
  faStar,
  faChevronRight
} from '@fortawesome/pro-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/pro-regular-svg-icons';
import Button from 'react-bootstrap/Button';

// Internal imports
import { AlertContext, AuthContext } from '../../App';
import { getCameraOrientation } from './helper.js';
import { addFavoriteCamera, deleteFavoriteCamera } from "../data/webcams";
import FriendlyTime from '../shared/FriendlyTime';

// Styling
import './CameraCard.scss';

import colocatedCamIcon from '../../images/colocated-camera.svg';
import trackEvent from '../shared/TrackEvent.js';

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import parse from "html-react-parser";

export default function CameraCard(props) {
  /* Setup */
  // Props
  const { cameraData, showLoader } = props;

  // Contexts
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);

  // Redux
  const dispatch = useDispatch();
  const { favCams } = useSelector(useCallback(memoize(state => ({
    favCams: state.user.favCams
  }))));

  // Refs
  const imageRef = useRef(null);

  // States
  const [show, setShow] = useState(true);
  const [camera, setCamera] = useState(cameraData);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

  // useEffect hooks
  useEffect(() => {
    // Do nothing and show loader if no camera data
    if (!cameraData) {
      return;
    }

    setCamera(cameraData);

    // Get the currently viewed camera data from the camera group
    const viewedCameraData = cameraData.camGroup.reduce((acc, cam) => {
      acc[cam.id] = cam;
      return acc;
    }, {})[camera.id];

    // If the camera data is not in the camera group (eg an edgecase when switching routes), use cameraData and exit
    if (!viewedCameraData) {
      setCamera(cameraData);
      return
    }

    if (viewedCameraData && camera && viewedCameraData.last_update_modified !== camera.last_update_modified)
      updateCameraImage(viewedCameraData);

    setCamera(viewedCameraData);

  }, [cameraData]);

  // Misc
  const navigate = useNavigate();

  /* Helpers */
  const toggleAuthModal = (action) => {
    setAuthContext((prior) => {
      if (!prior.showingModal) {
        return { ...prior, showingModal: true, action };
      }
      return prior;
    })
  };

  const updateCameraImage = (cam) => {
    setIsLoading(true);
    setIsUpdated(true);
    setShow(true)

    // Update the image src
    if (imageRef.current) {
      imageRef.current.src = `${cam.links.imageDisplay}?ts=${new Date(cam.last_update_modified).getTime()}`;
    }
  }

  /* Handlers */
  function handleClick() {
    navigate(`/cameras/${camera.id}`);
    window.snowplow('trackSelfDescribingEvent', {
      schema: 'iglu:ca.bc.gov.drivebc/action/jsonschema/1-0-0',
      data: {
        action: 'click',
        section: 'camera-list',
        category: 'camera',
        label: camera.name,
        sub_label: '',
      },
    });

    // Record scroll position
    const scrollableContainer = document.querySelector('#main');
    const scrollPosition = scrollableContainer.scrollTop;
    sessionStorage.setItem('scrollPosition', scrollPosition);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      handleClick();
    }
  }

  const addCamera = async () => {
    addFavoriteCamera(camera.id, dispatch, pushFavCam);
    setAlertMessage(<p>Saved to <a href="/my-cameras">My cameras</a></p>);
  }

  const deleteCamera = async () => {
    // use id from prop for deletion in saved cameras page
    deleteFavoriteCamera(camera.id, dispatch, removeFavCam);
    setAlertMessage(<p>Removed from <a href="/my-cameras">My cameras</a></p>);
  }

  const favoriteHandler = () => {
    // User logged in, default handler
    if (favCams && authContext.loginStateKnown && authContext.username) {
      if (favCams.includes(camera.id)) {
        deleteCamera();

      } else {
        addCamera();
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

  function handleChildClick(e) {
    e.stopPropagation();
    setShow(!show);
  }

  const changeCamera = (cam) => {
    setIsUpdated(false);
    setCamera(cam);
  }

  /* Rendering */
  // Main component
  const loading = (showLoader || isLoading)  ? 'loading' : '';
  const stale = camera && camera.marked_stale ? 'stale' : '';
  const delayed = camera && camera.marked_delayed ? 'delayed' : '';
  const unavailable = camera && camera.is_on ? '' : 'unavailable';
  const updated = isUpdated ? 'updated' : '';

  return (
    <div className={`camera-card ${updated} ${stale} ${delayed} ${unavailable} ${loading}`}>
      <div className="camera-card__body">
        <div className="card-img-box" onClick={handleClick} onKeyDown={handleKeyDown} tabIndex={0}>
          {camera &&
            <img
              ref={imageRef}
              className="card-img"
              src={`${camera.links.imageDisplay}`}
              alt={camera.name}
              onLoad={() => setIsLoading(false)}
              style={{ display: showLoader || isLoading || unavailable ? 'none' : 'block' }}
            />
          }

          {(showLoader || isLoading) ? <Skeleton height={200} /> : null}

          {!unavailable && !stale && !delayed && isUpdated && (
            <div className="card-notification">
              {showLoader ? <Skeleton /> : !isLoading && (
                <>
                  <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                    <p>
                      Camera image automatically updated to show the latest image received.
                    </p>
                    <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                  </div>
                  <div
                    className={'card-pill' + (show ? ' bounce' : ' hidden')}
                    onClick={handleChildClick}
                    onKeyDown={keyEvent => {
                      if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                        handleChildClick();
                      }
                    }}>
                    <p>Updated</p>
                    <FontAwesomeIcon icon={faCircleInfo} />
                  </div>
                </>
              )}
            </div>
          )}

          {!unavailable && stale && !delayed && (
            <div className="card-notification">
              {showLoader ? <Skeleton /> : !isLoading && (
                <>
                  <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                    <p>
                      Unable to retrieve latest image. Showing last image received.
                    </p>
                    <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                  </div>
                  <div
                    className={'card-pill' + (show ? ' bounce' : ' hidden')}
                    onClick={handleChildClick}
                    onKeyDown={keyEvent => {
                      if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                        handleChildClick();
                      }
                    }}>
                    <p>Stale</p>
                    <FontAwesomeIcon icon={faCircleInfo} />
                  </div>
                </>
              )}
            </div>
          )}

          {!unavailable && stale && delayed && (
            <div className="card-notification">
              {showLoader ? <Skeleton /> : !isLoading && (
                <>
                  <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                    <p>
                      Longer than expected delay, displaying last image received.
                    </p>
                    <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                  </div>
                  <div
                    className={'card-pill' + (show ? ' bounce' : ' hidden')}
                    onClick={handleChildClick}
                    onKeyDown={keyEvent => {
                      if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                        handleChildClick();
                      }
                    }}>
                    <p>Delayed</p>
                    <FontAwesomeIcon icon={faCircleInfo} />
                  </div>
                </>
              )}
            </div>
          )}

          {unavailable && !showLoader && !isLoading && (
            <>
              <div className="card-notification">
                <div className="card-pill">
                  <p>Unavailable</p>
                </div>
              </div>
              <div className="unavailable-message">
                <FontAwesomeIcon icon={faVideoSlash} />
                <p>
                  This traffic camera image is temporarily unavailable. Please
                  check again later.
                </p>
              </div>
            </>
          )}
        </div>

        {showLoader || isLoading ?
          <Skeleton height={14} /> :

          <div className="card-img-timestamp">
            <svg width="38" height="14" viewBox="0 0 32 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.75791 3.38603C1.75791 2.81155 1.71273 2.63885 1.34757 2.58951L1.15558 2.56484C1.08406 2.52255 1.07653 2.39214 1.16311 2.36042C1.90849 2.31813 2.61999 2.29346 3.36537 2.29346C4.11075 2.29346 4.72437 2.3428 5.29658 2.54017C6.48241 2.94195 7.07721 3.87945 7.07721 4.96498C7.07721 6.05051 6.54264 6.90342 5.54128 7.41446C4.96906 7.70347 4.25004 7.8092 3.57619 7.8092C3.01527 7.8092 2.45435 7.74224 2.14566 7.74224C1.77673 7.74224 1.46051 7.74928 1.05017 7.76691C0.997469 7.74224 0.978648 7.61183 1.03135 7.56249L1.23464 7.53782C1.74285 7.47085 1.76167 7.37569 1.76167 6.51221V3.38956L1.75791 3.38603ZM2.47694 6.31836C2.47694 6.75539 2.50329 7.0162 2.65387 7.21357C2.84586 7.46733 3.18091 7.54839 3.7343 7.54839C5.43587 7.54839 6.20007 6.50516 6.20007 4.97908C6.20007 4.07682 5.73703 2.54722 3.4369 2.54722C2.91739 2.54722 2.63881 2.61418 2.56729 2.66352C2.49576 2.71287 2.4807 2.91728 2.4807 3.28735V6.31836H2.47694Z" fill="white"/>
              <path d="M8.07122 5.38071C8.07122 5.05998 8.07122 5.02121 7.83406 4.86966L7.755 4.82032C7.72112 4.7886 7.72112 4.69697 7.76253 4.67229C7.96582 4.60533 8.42886 4.39386 8.65096 4.27051C8.69614 4.27756 8.72249 4.29518 8.72249 4.3269V4.8027C8.72249 4.84499 8.73002 4.86966 8.74884 4.87671C9.05754 4.64057 9.38881 4.38329 9.71256 4.38329C9.93091 4.38329 10.1078 4.51369 10.1078 4.71106C10.1078 4.98244 9.87068 5.08818 9.73139 5.08818C9.6448 5.08818 9.59963 5.06351 9.5394 5.03179C9.40764 4.95072 9.27588 4.89786 9.15541 4.89786C9.01613 4.89786 8.91072 4.97187 8.83919 5.06351C8.75261 5.17981 8.72626 5.41595 8.72626 5.69791V6.81515C8.72626 7.40726 8.74131 7.50594 9.07636 7.53061L9.39258 7.55528C9.45281 7.59758 9.43775 7.73503 9.37376 7.7597C8.95966 7.74208 8.70743 7.73503 8.39874 7.73503C8.09005 7.73503 7.819 7.74208 7.58936 7.7597C7.52913 7.73503 7.51031 7.59405 7.57054 7.55528L7.73994 7.53061C8.0637 7.48127 8.07122 7.40726 8.07122 6.81515V5.37718V5.38071Z" fill="white"/>
              <path d="M10.9849 5.38045C10.9849 5.05973 10.9849 5.02096 10.7478 4.86941L10.6687 4.82007C10.6348 4.78835 10.6348 4.69671 10.6762 4.67204C10.8795 4.60508 11.3802 4.39361 11.5797 4.27025C11.6249 4.27025 11.6588 4.28788 11.6663 4.3196C11.6475 4.6086 11.6287 4.99981 11.6287 5.33816V6.8149C11.6287 7.407 11.6475 7.48806 11.9637 7.53036L12.1482 7.55503C12.2084 7.59732 12.1933 7.73477 12.1293 7.75945C11.8658 7.74182 11.6136 7.73478 11.3049 7.73478C10.9962 7.73478 10.7252 7.74182 10.4805 7.75945C10.4202 7.73477 10.4014 7.5938 10.4617 7.55503L10.6461 7.53036C10.9699 7.48806 10.9812 7.407 10.9812 6.8149V5.37693L10.9849 5.38045ZM11.7152 3.04023C11.7152 3.33628 11.4969 3.46668 11.2484 3.46668C10.9774 3.46668 10.8005 3.27636 10.8005 3.05785C10.8005 2.78647 11.0113 2.61377 11.2748 2.61377C11.5383 2.61377 11.7115 2.81114 11.7115 3.04023H11.7152Z" fill="white"/>
              <path d="M13.1007 5.31733C12.9689 5.01423 12.8899 4.7499 12.5737 4.71113L12.4005 4.68646C12.3478 4.61949 12.3553 4.50671 12.4268 4.48204C12.6452 4.49614 12.9539 4.50671 13.2513 4.50671C13.4884 4.50671 13.6654 4.49614 13.9628 4.48204C14.023 4.51376 14.0305 4.64769 13.9703 4.68646L13.8649 4.70408C13.5938 4.74637 13.5826 4.78514 13.6729 5.03185C13.8762 5.59929 14.1284 6.17377 14.3317 6.60023C14.4108 6.76587 14.4446 6.83989 14.471 6.86456C14.5049 6.83989 14.5689 6.72358 14.6366 6.55088C14.7496 6.27245 15.0507 5.55699 15.1373 5.342C15.2615 5.053 15.2954 4.8803 15.2954 4.83096C15.2954 4.75695 15.2427 4.72523 15.1373 4.7076L14.934 4.68293C14.8813 4.62654 14.8889 4.51024 14.9528 4.47852C15.2239 4.49261 15.4422 4.50319 15.6116 4.50319C15.83 4.50319 15.9806 4.49261 16.2253 4.47852C16.2855 4.51024 16.2968 4.63359 16.2441 4.68293L16.1123 4.70056C15.8036 4.74285 15.7246 4.95431 15.4724 5.41602C15.3481 5.63806 14.806 6.82931 14.663 7.16766C14.5764 7.37208 14.4898 7.5624 14.3731 7.84083C14.3543 7.8655 14.3204 7.87255 14.2865 7.87255C14.2414 7.87255 14.1999 7.8655 14.1736 7.84083C14.1021 7.61174 13.9703 7.29102 13.8423 6.98439L13.1045 5.31733H13.1007Z" fill="white"/>
              <path d="M17.0984 5.63437C16.8688 5.63437 16.8613 5.65199 16.8613 5.85641C16.8613 6.68817 17.377 7.39306 18.3181 7.39306C18.608 7.39306 18.8527 7.312 19.1237 6.99128C19.2103 6.96661 19.2706 7.01595 19.2819 7.08996C18.992 7.65035 18.3595 7.85476 17.904 7.85476C17.3318 7.85476 16.8838 7.62568 16.6316 7.312C16.3681 6.99128 16.2627 6.60359 16.2627 6.2441C16.2627 5.23258 16.9742 4.38672 18.0283 4.38672C18.7812 4.38672 19.2743 4.87309 19.2743 5.36651C19.2743 5.48282 19.2555 5.54626 19.2405 5.5815C19.2141 5.63084 19.0899 5.63789 18.7209 5.63789H17.0984V5.63437ZM17.6443 5.38766C18.2918 5.38766 18.4875 5.35594 18.5553 5.3066C18.5817 5.28897 18.608 5.25725 18.608 5.15152C18.608 4.92243 18.4424 4.63343 17.9342 4.63343C17.4259 4.63343 16.9667 5.07751 16.9591 5.34889C16.9591 5.36651 16.9591 5.39118 17.0194 5.39118H17.6405L17.6443 5.38766Z" fill="white"/>
              <path d="M20.5542 3.38603C20.5542 2.7763 20.5203 2.62123 20.1251 2.58951L19.8427 2.56484C19.775 2.5155 19.7825 2.39214 19.854 2.36042C20.3283 2.31813 20.9231 2.29346 21.7401 2.29346C22.2934 2.29346 22.8205 2.33575 23.2158 2.52255C23.5922 2.69524 23.8821 3.02302 23.8821 3.54816C23.8821 4.14026 23.5132 4.44336 22.9861 4.67245C22.9861 4.75351 23.0576 4.77818 23.1518 4.79581C23.6261 4.87687 24.3301 5.28923 24.3301 6.16681C24.3301 7.11841 23.5734 7.75986 21.996 7.75986C21.7401 7.75986 21.3109 7.73519 20.942 7.73519C20.573 7.73519 20.2568 7.75281 19.9331 7.75986C19.8804 7.73519 19.8615 7.60478 19.9142 7.55544L20.0724 7.53077C20.5392 7.45676 20.5542 7.36864 20.5542 6.50516V3.38251V3.38603ZM21.2732 4.47861C21.2732 4.7077 21.2808 4.72532 21.7288 4.7077C22.6247 4.67598 23.1066 4.42926 23.1066 3.65389C23.1066 2.87851 22.4666 2.54369 21.8003 2.54369C21.6083 2.54369 21.4765 2.56131 21.3975 2.59303C21.3109 2.61771 21.2732 2.66 21.2732 2.80803V4.47508V4.47861ZM21.2732 6.38533C21.2732 6.68138 21.2921 7.10079 21.4577 7.28053C21.6234 7.47085 21.8869 7.50962 22.1504 7.50962C22.9334 7.50962 23.5282 7.18185 23.5282 6.36066C23.5282 5.71216 23.1781 4.95441 21.7815 4.95441C21.3071 4.95441 21.2732 5.00375 21.2732 5.1694V6.38533Z" fill="#FDB913"/>
              <path d="M26.0695 2.88534C26.7095 2.41659 27.5264 2.1875 28.4374 2.1875C28.9118 2.1875 29.5781 2.27914 29.9922 2.38487C30.0976 2.40954 30.1578 2.42716 30.2369 2.41659C30.2444 2.60691 30.2896 3.125 30.3611 3.62547C30.3159 3.68186 30.1842 3.69243 30.1239 3.63957C29.9922 3.08271 29.5969 2.44126 28.3245 2.44126C26.9805 2.44126 25.8399 3.23778 25.8399 4.94008C25.8399 6.64239 27.0069 7.61866 28.4449 7.61866C29.5781 7.61866 30.0788 6.92787 30.2783 6.44502C30.3385 6.40273 30.4703 6.42035 30.5079 6.47674C30.4477 6.9032 30.2181 7.44596 30.0863 7.60103C29.9809 7.61866 29.8755 7.65038 29.7776 7.6821C29.5856 7.74906 28.9532 7.87242 28.3922 7.87242C27.6017 7.87242 26.8488 7.72439 26.205 7.3226C25.5048 6.87147 24.959 6.12429 24.959 5.06344C24.959 4.15061 25.3994 3.37171 26.0658 2.88534H26.0695Z" fill="#FDB913"/>
            </svg>

            {!unavailable && <FriendlyTime date={camera.last_update_modified} asDate={true} />}
          </div>
        }

        {showLoader? <Skeleton  width={149} height={20}/> :
          <div className={`camera-orientations ${isLoading ? 'no-margin-top' : ''}`}>
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
                alt="colocated cameras icon"
                onClick={handleCameraImageClick}/>

              <span>Direction</span>
            </div>

            {camera.camGroup.map(cam => (
              <Button
                aria-label={getCameraOrientation(cam.orientation)}
                className={
                  'camera-direction-btn' +
                  (camera.id === cam.id ? ' current' : '')
                }
                key={cam.id}
                onClick={event => {
                  event.stopPropagation();
                  changeCamera(cam);
                  trackEvent('click', 'camera-list', 'camera', cam.name);
                }}>
                {cam.orientation}
              </Button>
            ))}
          </div>
        }

        {showLoader ?
          <div>
            <Skeleton height={20}/>
            <Skeleton width={210} height={8}/>
            <Skeleton width={246} height={8}/>
            <Skeleton width={261} height={8}/>
          </div> :

          <a className="camera-name bold" onClick={handleClick} onKeyDown={handleKeyDown}>{camera.name}</a>
        }

        {showLoader ?
          <Skeleton /> :

          <p className="label">{parse(camera.caption)}</p>
        }
      </div>

      <div className="camera-card__tools">
        {showLoader ?
          <Skeleton width={97} height={23}/> :

          <button
            className="viewMap-btn viewDetails-btn btn-tertiary"
            aria-label="View details"
            onClick={handleClick}
            onKeyDown={handleKeyDown}>
            <span>View details</span>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        }

        {/* Favorites button */}
        {showLoader &&
          <Skeleton width={97} height={23}/>
        }

        {!showLoader && authContext.loginStateKnown &&
          <button
            className={`favourite-btn btn-tertiary ${(favCams && favCams.includes(camera.id)) ? 'favourited' : ''}`}
            aria-label={`${(favCams && favCams.includes(camera.id)) ? 'Remove favourite' : 'Add favourite'}`}
            onClick={favoriteHandler}>

            {(favCams && favCams.includes(camera.id)) ?
              <React.Fragment><FontAwesomeIcon icon={faStar} /><span>Remove</span></React.Fragment> :
              <React.Fragment><FontAwesomeIcon icon={faStarOutline} /><span>Save</span></React.Fragment>
            }
          </button>
        }
      </div>
    </div>
  );
}
