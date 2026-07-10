// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { updatePendingAction } from '../../slices/userSlice';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faGear } from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

// Internal imports
import { AuthContext } from '../../App';
import {
  createEmailSubscription,
  patchEmailSubscription,
} from '../data/emailSubscriptions';
import ConsentModal from '../../ConsentModal';
import NotificationDateTime from '../routing/forms/NotificationDateTime';
import NotificationEventType from '../routing/forms/NotificationEventType';
import area1 from '../../images/areas/1.png';
import area2 from '../../images/areas/2.png';
import area3 from '../../images/areas/3.png';
import area4 from '../../images/areas/4.png';
import area5 from '../../images/areas/5.png';
import area6 from '../../images/areas/6.png';
import area7 from '../../images/areas/7.png';
import area8 from '../../images/areas/8.png';
import area9 from '../../images/areas/9.png';
import area10 from '../../images/areas/10.png';
import area11 from '../../images/areas/11.png';

// Styling
import './AreaNotificationCard.scss';
import '../routing/RouteDetails.scss';

const emptySubscriptionSettings = {
  notification_types: [],
  notification_days: [],
  notification_start_date: null,
  notification_end_date: null,
  notification_start_time: null,
  notification_end_time: null,
};

const areaImages = {
  1: area1,
  2: area2,
  3: area3,
  4: area4,
  5: area5,
  6: area6,
  7: area7,
  8: area8,
  9: area9,
  10: area10,
  11: area11,
};

export default function AreaNotificationCard({ area }) {
  /* Setup */
  // Context
  const { authContext } = useContext(AuthContext);

  // Navigation
  const navigate = useNavigate();

  // Redux
  const dispatch = useDispatch();
  const { emailSubscriptions, pendingAction } = useSelector(useCallback(memoize(state => ({
    emailSubscriptions: state.user.emailSubscriptions,
    pendingAction: state.user.pendingAction,
  }))));

  // Refs
  const EventTypeFormRef = useRef();
  const DateTimeFormRef = useRef();

  // Derived
  const subscription = (emailSubscriptions || []).find(sub => sub.area === area.id);

  // States
  const [notificationsEnabled, setNotificationsEnabled] = useState(!!subscription?.notification);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [showSpecificTimeDate, setShowSpecificTimeDate] = useState(
    !!subscription?.notification && !!subscription?.notification_start_time
  );
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Effects
  useEffect(() => {
    setNotificationsEnabled(!!subscription?.notification);
    setShowSpecificTimeDate(!!subscription?.notification && !!subscription?.notification_start_time);
  }, [subscription]);

  useEffect(() => {
    if (
      pendingAction?.action === 'toggleAreaNotification' &&
      pendingAction?.payload === area.id &&
      authContext.verified
    ) {
      setShowNotificationForm(true);
    }
  }, [pendingAction, authContext.verified, area.id]);

  /* Handlers */
  const toggleHandler = async (e) => {
    if (!authContext.verified) {
      e.preventDefault();

      dispatch(updatePendingAction({
        action: 'toggleAreaNotification',
        payload: area.id,
      }));

      navigate('/verify-email');
      return;
    }

    if (!authContext.consent) {
      e.preventDefault();
      setShowConsentModal(true);
      return;
    }

    if (notificationsEnabled && subscription) {
      const response = await patchEmailSubscription(subscription, { notification: false }, dispatch);
      setNotificationsEnabled(response.notification);
    } else {
      e.preventDefault();
      setShowNotificationForm(true);
    }
  };

  const validateSubmission = () => {
    const eventTypeValid = EventTypeFormRef.current.validateNotificationEventTypes();
    const dateTimeValid = DateTimeFormRef.current.validateNotificationDateTime();
    return eventTypeValid && dateTimeValid;
  };

  const saveHandler = async () => {
    if (!validateSubmission()) {
      return;
    }

    const defaultPayload = { notification: true };
    const eventTypePayload = EventTypeFormRef.current.getPayload();
    const dateTimePayload = DateTimeFormRef.current.getPayload();
    const payload = {
      ...defaultPayload,
      ...eventTypePayload,
      ...dateTimePayload
    };

    let response;
    if (subscription) {
      response = await patchEmailSubscription(subscription, payload, dispatch);
    } else {
      response = await createEmailSubscription(area.id, payload, dispatch);
    }

    setNotificationsEnabled(response.notification);
    setShowNotificationForm(false);
  };

  const formSettings = subscription || emptySubscriptionSettings;

  /* Rendering */
  return (
    <React.Fragment>
      <Modal
        show={showNotificationForm}
        onHide={() => setShowNotificationForm(false)}
        animation={false}
        className="modal--notifications-settings">
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="modal-title-icon">
              <FontAwesomeIcon icon={faBell} />
            </div>
            Notification settings
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <h3>Settings for {area.name}</h3>

          <div className="info-row row">
            <div className="info-row__label">
              <p className="bold">Email notifications</p>
            </div>

            <div className="info-row__data">
              <p className="email">{authContext.email}</p>
            </div>
          </div>

          <div className="info-row row">
            <div className="info-row__label">
              <p className="bold">Inform me about new and updated</p>
            </div>

            <div className="info-row__data">
              <NotificationEventType ref={EventTypeFormRef} route={formSettings} />
            </div>
          </div>

          <div className="info-row row">
            <div className="info-row__label">
              <p className="bold">Send me notifications</p>
            </div>

            <div className="info-row__data">
              <NotificationDateTime
                ref={DateTimeFormRef}
                route={formSettings}
                showSpecificTimeDate={showSpecificTimeDate}
                setShowSpecificTimeDate={setShowSpecificTimeDate} />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={saveHandler}>
            {notificationsEnabled ? 'Save notifications' : 'Enable notifications'}
            <FontAwesomeIcon icon={faCheck} />
          </Button>

          <Button
            variant="primary-outline"
            className="cancel-btn"
            onClick={() => setShowNotificationForm(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="area-notification-card">
        <div className="area-notification-card__header">
          <div className="notifications-settings">
            <Form className="notifications-toggle">
              <Form.Check
                onClick={toggleHandler}
                type="switch"
                id={'area-notifications-switch-' + area.id}
                label="Notifications"
                checked={notificationsEnabled}
              />
            </Form>
            {notificationsEnabled &&
              <FontAwesomeIcon
                icon={faGear}
                tabIndex={0}
                onClick={() => setShowNotificationForm(true)}
              />
            }
          </div>
        </div>

        <div className="area-map-preview">
          <img src={areaImages[area.id]} alt={`Map preview of ${area.name}`} />
        </div>

        <h3 className="area-name">{area.name}</h3>
      </div>

      {showConsentModal &&
        <ConsentModal
          setShowConsentModal={setShowConsentModal}
          postConsentHandler={() => setShowNotificationForm(true)} />
      }
    </React.Fragment>
  );
}
