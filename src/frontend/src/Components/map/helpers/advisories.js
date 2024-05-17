import { getBottomLeft, getTopRight } from 'ol/extent';
import { toLonLat } from 'ol/proj';
import * as turf from '@turf/turf';

const wrapLon = (value) => {
  const worlds = Math.floor((value + 180) / 360);
  return value - worlds * 360;
}

export const onMoveEnd = (map, advisories, setAdvisoriesInView) => {
  // calculate polygon based on map extent
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
    for (const advisory of advisories) {
      // For each polygon in multipolygon field
      for (const coords of advisory.geometry.coordinates) {
        // Build polygon and check if it intersects with map extent
        const advPoly = turf.polygon(coords);
        if (turf.booleanIntersects(mapPoly, advPoly)) {
          resAdvisories.push(advisory);
          break;
        }
      }
    }
  }
  setAdvisoriesInView(resAdvisories);
}
