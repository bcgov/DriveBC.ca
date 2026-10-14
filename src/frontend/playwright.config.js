import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// Fake hosts; all requests to them are fulfilled by e2e/fixtures.js
export const API_HOST = 'http://api.e2e.test';
export const TILES_HOST = 'http://tiles.e2e.test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // own port so a local dev server pointed at real APIs is never reused
    command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_API_HOST: API_HOST,
      VITE_BASE_MAP: `${TILES_HOST}/basemap/{z}/{y}/{x}.pbf`,
      VITE_MAP_STYLE: `${TILES_HOST}/style.json`,
      VITE_REPLAY_THE_DAY: `${API_HOST}/replay`,
      VITE_ROUTE_PLANNER: `${TILES_HOST}/route-planner`,
      VITE_GEOCODER_HOST: `${TILES_HOST}/geocoder`,
      VITE_ROUTABLE_LOCATIONS_HOST: `${TILES_HOST}/routable`,
      VITE_MAINTENANCE_MODE: 'false',
    },
  },
});
