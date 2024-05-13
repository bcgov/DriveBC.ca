// https://github.com/kamranahmedse/redux-persist-expire
// Copied over and fixed issue with expiry
const { createTransform } = require('redux-persist');

const transformRehydrate = (outboundState, config) => {
  outboundState = outboundState || null;

  // Temporary fix for the issue with expiry
  if (config.expiredState) {
    return config.expiredState;
  }

  // Check for the possible expiry if state has the persisted date
  if (config.expireSeconds && outboundState.timeStamp) {
    const startTime = new Date(outboundState.timeStamp).getTime();
    const endTime = new Date().getTime();

    const duration = endTime - startTime;
    const seconds = duration / 1000;

    // If the state is older than the set expiry time,
    // reset it to initial state
    if (seconds > config.expireSeconds) {
      return config.expiredState;
    }
  }

  return outboundState;
};

function expireReducer(reducerKey, config = {}) {
  const defaults = {
    // Seconds after which store will be expired
    expireSeconds: null,
    // State to be used for resetting e.g. provide initial reducer state
    expiredState: {},
  };

  config = Object.assign({}, defaults, config);

  return createTransform(
    // transform state on its way to being serialized and persisted.
    (inboundState) => inboundState,
    // transform state being rehydrated
    (outboundState) => transformRehydrate(outboundState, config),
  );
}

module.exports = expireReducer;
