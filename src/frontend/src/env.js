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
window.MAP_STYLE = `${process.env.REACT_APP_MAP_STYLE}`;
window.HIGHWAY_LAYER = `${process.env.REACT_APP_HIGHWAY_LAYER}`;
window.OPEN511_LAYER = `${process.env.REACT_APP_OPEN511_LAYER}`;
window.REPLAY_THE_DAY = `${process.env.REACT_APP_REPLAY_THE_DAY}`;
window.GEOCODER_HOST = `${process.env.REACT_APP_GEOCODER_HOST}`;
window.GEOCODER_API_AUTH_KEY = `${process.env.REACT_APP_GEOCODER_API_AUTH_KEY}`;
window.ROUTE_PLANNER = `${process.env.REACT_APP_ROUTE_PLANNER}`;
window.ROUTE_PLANNER_KEY = `${process.env.REACT_APP_ROUTE_PLANNER_KEY}`;
window.RECAPTCHA_SITE_KEY = `${process.env.REACT_APP_RECAPTCHA_SITE_KEY}`;
window.SURVEY_LINK = `${process.env.REACT_APP_SURVEY_LINK}`;
