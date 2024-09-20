/*
 eslint-disable no-console, import/no-unresolved
 */

const { test, expect } = require('@playwright/test');

function getTestID() {
  let { GITHUB_RUN_ID: RUM_TEST_ID } = process.env;
  if (!RUM_TEST_ID) {
    RUM_TEST_ID = Math.random().toString(36).substring(8);
  }
  console.log('Using RUM_TEST_ID:', RUM_TEST_ID);
  return RUM_TEST_ID;
}

test('Make a request that triggers a RUM request', async ({ page }) => {
  const testID = getTestID();
  const testURL = `https://main--rum-integrations--adobe.aem.live/?rum=on&test_rum_id=${testID}`;
  console.log('Accessing URL:', testURL);
  await page.goto(testURL);
  await expect(page.getByText('Boilerplate Highlights')).toBeVisible();
});
