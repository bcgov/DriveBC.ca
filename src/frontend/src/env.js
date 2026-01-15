console.log('=== ENV DEBUG ===');
console.log('All import.meta.env:', import.meta.env);
console.log('VITE_API_HOST from import.meta.env:', import.meta.env.VITE_API_HOST);



// Only access window if we are in the browser. Without this the build will fail.
const RUNTIME = (typeof window !== 'undefined') ? (window.__ENV__ || {}) : {};

console.log('window.__ENV__:', window.__ENV__);
console.log('RUNTIME object:', RUNTIME);

// During the build (Node.js), RUNTIME is {}, so it falls back to import.meta.env (which Vite replaces).
// In the browser, RUNTIME is populated, so it takes precedence.

export const API_HOST = RUNTIME.API_HOST || import.meta.env.VITE_API_HOST || '';
export const BASE_MAP = RUNTIME.BASE_MAP || import.meta.env.VITE_BASE_MAP || '';
export const REPORT_WMS_LAYER = RUNTIME.REPORT_WMS_LAYER || import.meta.env.REPORT_WMS_LAYER || '';
export const MAP_STYLE = RUNTIME.MAP_STYLE || import.meta.env.VITE_MAP_STYLE || '';
export const REPLAY_THE_DAY = RUNTIME.REPLAY_THE_DAY || import.meta.env.VITE_REPLAY_THE_DAY || '';
export const GEOCODER_HOST = RUNTIME.GEOCODER_HOST || import.meta.env.VITE_GEOCODER_HOST || '';
export const GEOCODER_API_CLIENT_ID = RUNTIME.GEOCODER_API_CLIENT_ID || import.meta.env.VITE_GEOCODER_API_CLIENT_ID || '';
export const ROUTE_PLANNER = RUNTIME.ROUTE_PLANNER || import.meta.env.VITE_ROUTE_PLANNER || '';
export const ROUTE_PLANNER_CLIENT_ID = RUNTIME.ROUTE_PLANNER_CLIENT_ID || import.meta.env.VITE_ROUTE_PLANNER_CLIENT_ID || '';
export const PRIMARY_ROUTE_GDF = RUNTIME.PRIMARY_ROUTE_GDF || import.meta.env.VITE_PRIMARY_ROUTE_GDF || '';
export const PRIMARY_ROUTE_XINGCOST = RUNTIME.PRIMARY_ROUTE_XINGCOST || import.meta.env.VITE_PRIMARY_ROUTE_XINGCOST || '';
export const PRIMARY_ROUTE_TURNCOST = RUNTIME.PRIMARY_ROUTE_TURNCOST || import.meta.env.VITE_PRIMARY_ROUTE_TURNCOST || '';
export const ALTERNATE_ROUTE_GDF = RUNTIME.ALTERNATE_ROUTE_GDF || import.meta.env.VITE_ALTERNATE_ROUTE_GDF || '';
export const ALTERNATE_ROUTE_XINGCOST = RUNTIME.ALTERNATE_ROUTE_XINGCOST || import.meta.env.VITE_ALTERNATE_ROUTE_XINGCOST || '';
export const ALTERNATE_ROUTE_TURNCOST = RUNTIME.ALTERNATE_ROUTE_TURNCOST || import.meta.env.VITE_ALTERNATE_ROUTE_TURNCOST || '';
export const RECAPTCHA_CLIENT_ID = RUNTIME.RECAPTCHA_CLIENT_ID || import.meta.env.VITE_RECAPTCHA_CLIENT_ID;
export const SURVEY_LINK = RUNTIME.SURVEY_LINK || import.meta.env.VITE_SURVEY_LINK;
export const BCEID_REGISTER_URL = RUNTIME.BCEID_REGISTER_URL || import.meta.env.VITE_BCEID_REGISTER_URL;
export const DEPLOYMENT_TAG = RUNTIME.DEPLOYMENT_TAG || import.meta.env.VITE_DEPLOYMENT_TAG;
export const RELEASE = RUNTIME.RELEASE || import.meta.env.VITE_RELEASE;
export const FROM_EMAIL = RUNTIME.FROM_EMAIL || import.meta.env.VITE_FROM_EMAIL;
export const LEGACY_URL = RUNTIME.LEGACY_URL || import.meta.env.VITE_LEGACY_URL;

console.log('EXPORTED API_HOST:', API_HOST);
console.log('EXPORTED BASE_MAP:', BASE_MAP);
console.log('=================');