// Styling
import { cameraStyles } from '../../data/featureStyleDefinitions.js';

const getStyleKey = (baseKey, updated) => {
  return updated ? `${baseKey}_unread` : baseKey;
};

// Static assets
export const setCameraStyle = (cameras, state) => {
  if (!Array.isArray(cameras)) { cameras = [cameras]; }
  cameras.forEach((camera) => {
    const updated = cameras[0].updated;
    if(updated) {
      return camera.setStyle(cameraStyles.cameras_unread[state]);
    } else {
      return camera.setStyle(cameraStyles[getStyleKey('cameras', updated)][state]);
    }
  })
};
