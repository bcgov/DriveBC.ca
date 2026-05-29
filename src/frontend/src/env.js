const runtimeEnv = (typeof globalThis !== 'undefined' && globalThis.__ENV__) || {};
const getEnv = (key, fallback = '') => {
  return runtimeEnv[key] ?? process.env[`REACT_APP_${key}`] ?? fallback;
};

export const BASE_MAP = `${getEnv('BASE_MAP')}`;
export const MAP_STYLE = `${getEnv('MAP_STYLE')}`;
export const API_HOST = `${getEnv('API_HOST')}`;
export const REPORT_WMS_LAYER = `${getEnv('REPORT_WMS_LAYER')}`;
export const GEOCODER_HOST = `${getEnv('GEOCODER_HOST')}`;
export const GEOCODER_API_CLIENT_ID = `${getEnv('GEOCODER_API_CLIENT_ID')}`;
export const ROUTABLE_LOCATIONS_HOST = `${getEnv('ROUTABLE_LOCATIONS_HOST')}`;
export const ROUTE_PLANNER = `${getEnv('ROUTE_PLANNER')}`;
export const ROUTE_PLANNER_CLIENT_ID = `${getEnv('ROUTE_PLANNER_CLIENT_ID')}`;
export const REPLAY_THE_DAY = `${getEnv('REPLAY_THE_DAY')}`;
export const SURVEY_LINK = `${getEnv('SURVEY_LINK')}`;
export const BCEID_REGISTER_URL = `${getEnv('BCEID_REGISTER_URL')}`;
export const FROM_EMAIL = `${getEnv('FROM_EMAIL')}`;
export const LEGACY_URL = `${getEnv('LEGACY_URL')}`;
export const RECAPTCHA_CLIENT_ID = `${getEnv('RECAPTCHA_CLIENT_ID')}`;
export const PRIMARY_ROUTE_GDF = `${getEnv('PRIMARY_ROUTE_GDF')}`;
export const PRIMARY_ROUTE_TURNCOST = `${getEnv('PRIMARY_ROUTE_TURNCOST')}`;
export const PRIMARY_ROUTE_XINGCOST = `${getEnv('PRIMARY_ROUTE_XINGCOST')}`;
export const ALTERNATE_ROUTE_GDF = `${getEnv('ALTERNATE_ROUTE_GDF')}`;
export const ALTERNATE_ROUTE_TURNCOST = `${getEnv('ALTERNATE_ROUTE_TURNCOST')}`;
export const ALTERNATE_ROUTE_XINGCOST = `${getEnv('ALTERNATE_ROUTE_XINGCOST')}`;

export const DEPLOYMENT_TAG = runtimeEnv.DEPLOYMENT_TAG ?? process.env.DEPLOYMENT_TAG ?? '';
export const MAINTENANCE_MODE = runtimeEnv.MAINTENANCE_MODE ?? process.env.MAINTENANCE_MODE ?? 'false';
export const RELEASE = runtimeEnv.RELEASE ?? process.env.RELEASE ?? '';