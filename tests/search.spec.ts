// import { test } from '@playwright/test';
// import { getLoggedInPage } from './helpers';

// test.describe('Search', () => {
//   test.beforeEach(async ({ page }) => {
//     await getLoggedInPage(page, '/sok');
//   });

//   test('Mix of letters and numbers should not search', async ({ page }) => {
//     const TEST_STRING = 'Martin12121248484';

//     const searchField = await page.waitForSelector('data-testid=search-input');
//     await searchField.fill(TEST_STRING);
//     await page.waitForSelector('data-testid=search-result-none', { timeout: 3000 });
//   });

//   test('A set of letters should search for people', async ({ page }) => {
//     const TEST_STRING = 'Martin';

//     const searchField = await page.waitForSelector('data-testid=search-input');
//     await searchField.fill(TEST_STRING);

//     await page.waitForSelector('data-testid=search-loading-people', { timeout: 3000 });
//   });
// });
