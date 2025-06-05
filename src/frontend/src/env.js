/* This file exists to take environment variables and populate them in the
 * browser, using Create React App's build-time substitution mechanism for
 * environment variables starting REACT_APP_.  Previously, these values were
 * 'baked in' to the image at build time in the Github action.
 *
 * In OpenShift, a different process adds these actual values from the runtime
 * environment (where they're populated by a config map).  The script runs in
 * Openshift as a docker-entrypoint.d shell script, appending the same list to
 * the end of the bundle file, overriding any values or undefineds here.
 *
 * These are defined here so that they're included in the dev environment that
 * runs locally and has only the node build step.
 */
window.API_HOST = `${process.env.REACT_APP_API_HOST}`;
window.BASE_MAP = `${process.env.REACT_APP_BASE_MAP}`;
window.REPORT_WMS_LAYER = `${process.env.REACT_APP_REPORT_WMS_LAYER}`;
window.MAP_STYLE = `${process.env.REACT_APP_MAP_STYLE}`;
window.REPLAY_THE_DAY = `${process.env.REACT_APP_REPLAY_THE_DAY}`;
window.GEOCODER_HOST = `${process.env.REACT_APP_GEOCODER_HOST}`;
window.GEOCODER_API_CLIENT_ID = `${process.env.REACT_APP_GEOCODER_API_CLIENT_ID}`;
window.ROUTE_PLANNER = `${process.env.REACT_APP_ROUTE_PLANNER}`;
window.ROUTE_PLANNER_CLIENT_ID = `${process.env.REACT_APP_ROUTE_PLANNER_CLIENT_ID}`;
window.ALTERNATE_ROUTE_GDF = `${process.env.REACT_APP_ALTERNATE_ROUTE_GDF}`;
window.ALTERNATE_ROUTE_XINGCOST = `${process.env.REACT_APP_ALTERNATE_ROUTE_XINGCOST}`;
window.ALTERNATE_ROUTE_TURNCOST = `${process.env.REACT_APP_ALTERNATE_ROUTE_TURNCOST}`;
window.RECAPTCHA_CLIENT_ID = `${process.env.REACT_APP_RECAPTCHA_CLIENT_ID}`;
window.SURVEY_LINK = `${process.env.REACT_APP_SURVEY_LINK}`;
window.BCEID_REGISTER_URL = `${process.env.REACT_APP_BCEID_REGISTER_URL}`;
window.DEPLOYMENT_TAG = `${process.env.REACT_APP_DEPLOYMENT_TAG || ''}`
window.RELEASE = `${process.env.REACT_APP_RELEASE || ''}`
window.FROM_EMAIL = `${process.env.REACT_APP_FROM_EMAIL}`;
window.LEGACY_URL = `${process.env.REACT_APP_LEGACY_URL}`;
