import { get } from "./helper.js";

export function getFloodGate() {
  const url = `${window.API_HOST}/api/cms/floodgate/`;
  return get(url).then((data) => data);
}

export function markFloodGateAsRead(fgData, cmsContext, setCMSContext) {
  const fgIds = fgData.map(fg => fg.id.toString() + '-' + fg.live_revision.toString());

  // Combine and remove duplicates
  const readFloodGates = Array.from(
    new Set(
      (cmsContext.readFloodGates ? [...fgIds, ...cmsContext.readFloodGates] : [...fgIds])
    )
  );
  const updatedContext = {...cmsContext, readFloodGates: readFloodGates};

  setCMSContext(updatedContext);
  localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
}
