import { test, expect, loadFixture } from './fixtures';

const cards = (page) => page.locator('.camera-card');
const search = (page) => page.getByLabel('input field for camera name search');

test.describe('Cameras list page', () => {
  test('lists cameras grouped and sorted by highway', async ({ page }) => {
    await page.goto('/cameras');

    await expect(page.getByRole('heading', { name: 'Cameras', exact: true })).toBeVisible();
    await expect(cards(page)).toHaveCount(5);
    await expect(page.locator('.highway-name__number'))
      .toHaveText(['Highway 1', 'Highway 3', 'Highway 5', 'Highway 16']);
    await expect(page.getByRole('heading', { name: 'Trans Canada' })).toBeVisible();
    await expect(page.locator('.highway-group').first().locator('.camera-name'))
      .toHaveText(['Cole Road - E', 'Malahat Drive - N']);
  });

  test('filters by camera name and caption', async ({ page }) => {
    await page.goto('/cameras');
    await expect(cards(page)).toHaveCount(5);

    await search(page).fill('kootenay');
    await expect(page.locator('.camera-name')).toHaveText(['Kootenay Pass']);

    // caption match
    await search(page).fill('great bear snowshed');
    await expect(page.locator('.camera-name')).toHaveText(['Coquihalla Great Bear Snowshed - N']);

    await page.getByLabel('Clear camera name search').click();
    await expect(cards(page)).toHaveCount(5);
  });

  test('shows empty state when search has no match', async ({ page }) => {
    await page.goto('/cameras');
    await search(page).fill('no such camera');

    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'No cameras to display' })).toBeVisible();
  });

  test('filters by highway', async ({ page }) => {
    await page.goto('/cameras');
    await expect(cards(page)).toHaveCount(5);

    await page.getByLabel('show filters options').click();
    await page.getByRole('radiogroup', { name: 'Highways' }).getByLabel('Highway 1', { exact: true }).check();
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page.locator('.camera-name')).toHaveText(['Cole Road - E', 'Malahat Drive - N']);
    await expect(page.locator('.filters-btn .filter-count')).toHaveText('1');

    // remove pill restores full list
    await page.locator('.selected-filter', { hasText: 'Highway 1' }).locator('.remove-btn').click();
    await expect(cards(page)).toHaveCount(5);
  });

  test('marks cameras that are off as unavailable', async ({ page, api }) => {
    const webcams = loadFixture('webcams').map((cam) => (cam.id === 5 ? { ...cam, is_on: false } : cam));
    api.respond('/api/webcams/', webcams);

    await page.goto('/cameras');

    const card = cards(page).filter({ hasText: 'Kootenay Pass' });
    await expect(card).toHaveClass(/unavailable/);
    await expect(card.getByText('This traffic camera image is temporarily unavailable')).toBeVisible();
  });

  test('opens camera on the map when name is clicked', async ({ page }) => {
    await page.goto('/cameras');
    await page.locator('.camera-name', { hasText: 'Kootenay Pass' }).click();

    await expect(page).toHaveURL(/\/cameras\/5\?camIndex=0&pan=/);
  });

  test('shows server error popup when cameras fail to load', async ({ page, api }) => {
    api.respond('/api/webcams/', {}, 500);

    await page.goto('/cameras');

    await expect(page.getByText('Page information not updated recently')).toBeVisible();
  });
});
