/* eslint-disable no-prototype-builtins */

function merge(obj1, obj2) {
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
        obj1[key] = merge(obj1[key], obj2[key]);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
}

export default {
  "TOPOGRAPHIC/BC Terrestrial/Base": {
    paint: {
      "fill-color": "#f5f3f3"
    },
  },
  merge,
};
