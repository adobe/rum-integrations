const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');

function getTestID() {
  let { RUM_TEST_ID } = process.env;
  if (!RUM_TEST_ID) {
    RUM_TEST_ID = Math.random().toString(36).substring(8);
  }
  console.log('Using RUM_TEST_ID', RUM_TEST_ID);
  return RUM_TEST_ID;
}


test('Make a request that triggers a RUM request', async ({ page }) => {
  const testID = getTestID();
  await page.goto(`https://main--rum-integrations--adobe.aem.live/?rum=on&test_rum_id=${testID}`);
  await expect(page.getByText('Boilerplate Highlights')).toBeVisible();

  // Wait 5 seconds for the rum request to appear at the backend
  await page.waitForTimeout(5000);

  const cmdline =
    `bq query --format json --nouse_legacy_sql 'SELECT count(*) FROM \`helix-225321.helix_rum.cluster\`
    WHERE url = "https://main--rum-integrations--adobe.aem.live/" AND id = "${testID}" LIMIT 10'`;
  console.log('Executing: ', cmdline);

  try {
    const res = execSync(cmdline);
    console.log('*** Result:', res);
  } catch (e) {
    console.error('*** Error:', e);
  }
  // const result = res.trim();

  // console.log('Result:', result);
  // expect(Number(result)).toBeGreaterThan(5);
});
