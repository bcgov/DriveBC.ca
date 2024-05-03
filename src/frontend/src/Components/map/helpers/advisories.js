import { getBottomLeft, getTopRight } from 'ol/extent';
import { toLonLat } from 'ol/proj';
import * as turf from '@turf/turf';

const wrapLon = (value) => {
  const worlds = Math.floor((value + 180) / 360);
  return value - worlds * 360;
}

export const onMoveEnd = (e, advisories, setAdvisoriesInView) => {
  // calculate polygon based on map extent
  const map = e.map;
  const extent = map.getView().calculateExtent(map.getSize());
  const bottomLeft = toLonLat(getBottomLeft(extent));
  const topRight = toLonLat(getTopRight(extent));

  const mapPoly = turf.polygon([[
    [wrapLon(bottomLeft[0]), topRight[1]], // Top left
    [wrapLon(bottomLeft[0]), bottomLeft[1]], // Bottom left
    [wrapLon(topRight[0]), bottomLeft[1]], // Bottom right
    [wrapLon(topRight[0]), topRight[1]], // Top right
    [wrapLon(bottomLeft[0]), topRight[1]], // Top left
  ]]);

  // Update state with advisories that intersect with map extent
  const resAdvisories = [];
  if (advisories && advisories.length > 0) {
    advisories.forEach(advisory => {
      const advPoly = turf.polygon(advisory.geometry.coordinates);
      if (turf.booleanIntersects(mapPoly, advPoly)) {
        resAdvisories.push(advisory);
      }
    });
  }
  setAdvisoriesInView(resAdvisories);
}
