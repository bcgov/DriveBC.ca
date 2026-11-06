import { describe, expect, it } from 'vitest';
import { getInitialCameraIndex } from './webcams';

describe('getInitialCameraIndex', () => {
  const camGroup = [
    { id: 395, orientation: 'N' },
    { id: 396, orientation: 'S' },
  ];

  it('selects the camera addressed by the details path when camIndex is absent', () => {
    expect(getInitialCameraIndex(camGroup, '396', null)).toBe(1);
  });

  it('uses camIndex when the URL explicitly provides it', () => {
    expect(getInitialCameraIndex(camGroup, '396', '1')).toBe(1);
    expect(getInitialCameraIndex(camGroup, '396', '0')).toBe(0);
  });

  it('falls back to the path camera when camIndex is invalid', () => {
    expect(getInitialCameraIndex(camGroup, '396', 'invalid')).toBe(1);
  });
});
