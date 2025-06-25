import { get } from "./helper.js";

export function getEmergencyAlert() {
  const url = `${window.API_HOST}/api/cms/emergency-alert/`;
  return get(url);
}

export function markEmergencyAlertAsRead(data, cmsContext) {
  const ids = data.map(datum => datum.id.toString() + '-' + datum.live_revision.toString());

  // Combine and remove duplicates
  const readEmergencyAlerts = Array.from(
    new Set(
      (cmsContext.readEmergencyAlert ? [...ids, ...cmsContext.readEmergencyAlerts] : [...ids])
    )
  );
  const updatedContext = {...cmsContext, readEmergencyAlerts: readEmergencyAlerts};

  console.log('setting cmscontext');
  localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
  return updatedContext;
}
