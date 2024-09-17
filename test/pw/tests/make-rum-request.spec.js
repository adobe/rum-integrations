/*
 eslint-disable no-console, import/no-unresolved
 */

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

  const cmdline = `bq query --format json --nouse_legacy_sql 'SELECT count(*) FROM \`helix-225321.helix_rum.cluster\`
    WHERE url = "https://main--rum-integrations--adobe.aem.live/" AND id = "${testID}" LIMIT 10'`;
  console.log('Executing: ', cmdline);

  let res;
  try {
    res = execSync(cmdline);
  } catch (e) {
    console.error('*** Error:', e);
    console.log('Stdout: ', e.stdout.toString());
    console.log('Stderr: ', e.stderr.toString());
    throw e;
  }

  const result = res.toString();

  console.log('Result:', result);
  const json = JSON.parse(result);
  const obj = json[0];
  const keys = Object.keys(obj);
  const val = obj[keys[0]];
  console.log('Value:', val);

  // Expect at least 2 log entries in google BigQuery with the ID
  expect(Number(val)).toBeGreaterThan(2);
});
