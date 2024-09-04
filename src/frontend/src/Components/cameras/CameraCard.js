// React
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { pushFavCam, removeFavCam, updatePendingAction } from '../../slices/userSlice';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faXmark,
  faCircleInfo,
  faVideoSlash,
  faStar,
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

export default function CameraCard(props) {
  /* Setup */
  // Props
  const { cameraData, showLoader } = props;

  // Navigation
  const location = useLocation();

  // Contexts
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);

  // Redux
  const dispatch = useDispatch();
  const { favCams } = useSelector(useCallback(memoize(state => ({
    favCams: state.user.favCams
  }))));

  // States
  const [show, setShow] = useState(false);
  const [camera, setCamera] = useState(cameraData);

  // useEffect hooks
  useEffect(() => {
    setCamera(cameraData);
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

    sessionStorage.setItem('scrollPosition', window.pageYOffset);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      handleClick();
    }
  }

  function handleViewOnMap() {
    const refCamData = { ...camera };
    refCamData.type = 'camera';

    navigate({
      pathname: '/',
      search: `?${createSearchParams({
        type: "camera",
        id: camera.id,
      })}`
    });

    window.snowplow('trackSelfDescribingEvent', {
      schema: 'iglu:ca.bc.gov.drivebc/action/jsonschema/1-0-0',
      data: {
        action: 'click',
        section: 'camera-list',
        category: 'Camera',
        label: camera.name,
        sub_label: 'View on Map Select',
      },
    });
  }

  const addCamera = async () => {
    addFavoriteCamera(camera.id, dispatch, pushFavCam);
    setAlertMessage(<p>Saved to <a href="/my-cameras">My cameras</a></p>);
  }

  const deleteCamera = async () => {
    // use id from prop for deletion in saved cameras page
    const id = location.pathname == '/my-cameras' ? cameraData.id : camera.id;
    deleteFavoriteCamera(id, dispatch, removeFavCam);
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
      toggleAuthModal('Sign In');
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

  /* Rendering */
  // Main component
  const stale = camera.marked_stale ? 'stale' : '';
  const delayed = camera.marked_delayed ? 'delayed' : '';
  const unavailable = camera.is_on ? '' : 'unavailable';

  return (
    <div className={`camera-card ${stale} ${delayed} ${unavailable}`}>
      <div className="camera-card__body" onClick={handleClick} onKeyDown={handleKeyDown} tabIndex={0}>
        {!unavailable && !delayed && !stale && (
          <div className="card-img-box">
            { showLoader ? <Skeleton height={180} /> :
              <img
                className="card-img"
                src={camera.links.imageDisplay}
                alt={camera.name} />
            }
          </div>
        )}

        {!unavailable && stale && !delayed && (
          <div className="card-img-box">
            { showLoader ? <Skeleton height={180} /> :
            <img
              className="card-img"
              src={camera.links.imageDisplay}
              alt={camera.name}
            />
        }
            <div className="card-notification">
              { showLoader ? <Skeleton />:
              <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                <p>
                  Unable to retrieve latest image. Showing last image received.
                </p>
                <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
              </div>
              }
              <div
                className={'card-pill' + (show ? ' bounce' : ' hidden')}
                onClick={handleChildClick}
                onKeyDown={keyEvent => {
                  if (keyEvent.keyCode == 13) {
                    handleChildClick();
                  }
                }}>
                <p>Stale</p>
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>
            </div>
          </div>
        )}

        {!unavailable && stale && delayed && (
          <div className="card-img-box">
            { showLoader ? <Skeleton height={180} /> :
            <img
              className="card-img"
              src={camera.links.imageDisplay}
              alt={camera.name}
            />
        }
            <div className="card-notification">
              { showLoader ? <Skeleton height={180} /> :
                <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                  <p>
                    Longer than expected delay, displaying last image received.
                  </p>
                  <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                </div>
              }

              <div
                className={'card-pill' + (show ? ' bounce' : ' hidden')}
                onClick={handleChildClick}
                onKeyDown={keyEvent => {
                  if (keyEvent.keyCode == 13) {
                    handleChildClick();
                  }
                }}>
                <p>Delayed</p>
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>
            </div>
          </div>
        )}


        {unavailable && (
          showLoader ? <Skeleton height={312}/> :
          <div className="card-img-box">
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

          </div>
        )}
        { showLoader? <Skeleton height={34} /> :
            <div className="card-img-timestamp">
            <p className="driveBC">
              Drive<span>BC</span>
            </p>
            <FriendlyTime date={camera.last_update_modified} asDate={true} />
          </div>
        }


        { showLoader? <Skeleton  width={149} height={20}/>:
          <div className="camera-orientations">
          <img
            className="colocated-camera-icon"
            src={colocatedCamIcon}
            role="presentation"
            alt="colocated cameras icon"
          />
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
                setCamera(cam);
                trackEvent('click', 'camera-list', 'camera', cam.name);
              }}>
              {cam.orientation}
            </Button>
          ))}
        </div>

        }

        { showLoader? (<div><Skeleton height={20}/><Skeleton width={210} height={8} /><Skeleton width={246} height={8} /><Skeleton width={261} height={8} /></div>) : <p className="camera-name bold">{camera.name}</p>}
        { showLoader? (<Skeleton />) : <p className="label">{camera.caption}</p>}

      </div>

      <div className="camera-card__tools">
        {showLoader ?
          <Skeleton width={97} height={23}/> : (
          <button
            className="viewMap-btn"
            aria-label="View on map"
            onClick={handleViewOnMap}>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            <span>View on map</span>
          </button>
        )}

        {authContext.loginStateKnown &&
          <button
            className={`favourite-btn ${(favCams && favCams.includes(camera.id)) ? 'favourited' : ''}`}
            aria-label={`${(favCams && favCams.includes(camera.id)) ? 'Remove favourite' : 'Add favourite'}`}
            onClick={favoriteHandler}>

            {(favCams && favCams.includes(camera.id)) ?
            (showLoader? <Skeleton width={97} height={23}/>: <React.Fragment><FontAwesomeIcon icon={faStar} /><span>Remove</span></React.Fragment>) :
            (showLoader? <Skeleton width={97} height={23}/>: <React.Fragment><FontAwesomeIcon icon={faStarOutline} /><span>Save</span></React.Fragment>) }
          </button>
        }
      </div>
    </div>
  );
}
