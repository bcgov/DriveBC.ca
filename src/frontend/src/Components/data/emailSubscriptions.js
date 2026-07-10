import { getCookie } from "../../util";
import { API_HOST } from '../../env';
import {
  pushEmailSubscription,
  removeEmailSubscription,
  updateEmailSubscriptions,
  updateSingleEmailSubscription,
} from '../../slices/userSlice';

export const getEmailSubscriptions = async (headers = {}) => {
  const url = `${API_HOST}/api/users/email-subscriptions/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json();
}

export const createEmailSubscription = async (areaId, body, dispatch) => {
  const url = `${API_HOST}/api/users/email-subscriptions/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({ area: areaId, ...body }),
    credentials: 'include'
  });

  if (!response.ok) {
    const errData = await response.json();
    if ('code' in errData && errData.code === 'duplicate_area') {
      throw new Error('duplicate_area');
    }

    throw new Error(`Error: ${response.statusText}`);
  }

  const savedSubscription = await response.json();
  dispatch(pushEmailSubscription(savedSubscription));
  return savedSubscription;
}

export const patchEmailSubscription = async (subscription, body, dispatch) => {
  const url = `${API_HOST}/api/users/email-subscriptions/${subscription.id}/`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify(body),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  const savedSubscription = await response.json();
  dispatch(updateSingleEmailSubscription(savedSubscription));
  return savedSubscription;
}

export const deleteEmailSubscription = async (subscription, dispatch) => {
  const url = `${API_HOST}/api/users/email-subscriptions/${subscription.id}/`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  dispatch(removeEmailSubscription(subscription.id));
}

export { updateEmailSubscriptions };
