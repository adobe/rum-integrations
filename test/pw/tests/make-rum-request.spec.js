/*
 eslint-disable no-console, import/no-unresolved
 */

const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');

function getTestID() {
  let { GITHUB_RUN_ID: RUM_TEST_ID } = process.env;
  if (!RUM_TEST_ID) {
    RUM_TEST_ID = Math.random().toString(36).substring(8);
  }
  console.log('Using RUM_TEST_ID:', RUM_TEST_ID);
  return RUM_TEST_ID;
}

function checkBigQueryResult(testID) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdate = yesterday.toISOString().split('T')[0];

  const cmdline = `bq query --format json --nouse_legacy_sql '/* repository: adobe/rum-integrations */
    SELECT count(*) FROM \`helix-225321.helix_rum.cluster\`
    WHERE TIMESTAMP_TRUNC(time, DAY) > TIMESTAMP("${yesterdate}")
    AND hostname = "main--rum-integrations--adobe.aem.live" AND id = "${testID}" LIMIT 1'`;
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

  // Expect at least one log entries in google BigQuery with the ID
  expect(Number(val)).toBeGreaterThan(0);
}

/*
async function checkCoralogixResult(testID) {
  const now = new Date().toISOString();
  const startDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const query = `{"query":"source logs \
  | filter $l.applicationname ~ 'helix-rum-collector' \
  | filter $d.cdn.domain ~ 'main--rum-integrations--adobe.aem.live' \
  | filter $d.request.id ~ '${testID}' \
  | limit 1",
  "metadata": {
    "tier": "TIER_ARCHIVE",
    "startDate": "${startDate}",
    "endDate": "${now}"
  }}`;

  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <token>',
    },
    body: query,
  };

  console.log('Querying Coralogix with:', query);
  const res = await fetch('https://ng-api-http.coralogix.com/api/v1/dataprime/query', opts);

  console.log('Coralogix response status:', res.status);
  expect(res.status).toBe(200);

  const responseText = await res.text();
  console.log('Coralogix response:', responseText);

  const lines = responseText.split('\n');

  let result;
  // eslint-disable-next-line no-restricted-syntax
  for (const line of lines) {
    if (line.trim().startsWith('{"result":')) {
      result = line;
      break;
    }
  }

  if (!result) {
    throw new Error('No result found in Coralogix response');
  }

  const json = JSON.parse(result);
  console.log('Coralogix Response:', json);
}
*/

test('Make a request that triggers a RUM request', async ({ page }) => {
  const testID = getTestID();
  const testURL = `https://main--rum-integrations--adobe.aem.live/?rum=on&test_rum_id=${testID}`;
  console.log('Accessing URL:', testURL);
  await page.goto(testURL);
  await expect(page.getByText('Boilerplate Highlights')).toBeVisible();

  // Wait 5 seconds for the rum request to appear at the backend
  await page.waitForTimeout(5000);

  await checkBigQueryResult(testID);
  // await checkCoralogixResult(testID);
});

/*
test('Query Coralogix', async () => {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  console.log('Yesterday:', yesterday);
  console.log('Now:', now);

  // const query0 = '{"query":"filter $l.applicationname ~ \'helix-rum-collector\'
  // | lucene \'cdn.domain:docs.zebra.com\' | limit 1"}';
  // eslint-disable-next-line no-multi-str
  const query2 = '{"query":"source logs \
    | filter $l.applicationname ~ \'helix-rum-collector\' \
    | filter $d.cdn.domain ~ \'main--rum-integrations--adobe.aem.live\'", \
    "metadata": { \
      "tier": "TIER_ARCHIVE", \
      "startDate": "2024-09-18T00:00:00.00Z", \
      "endDate": "2024-09-19T09:00:00.00Z" \
    }}';
  // eslint-disable-next-line no-multi-str
  const query = `{"query":"source logs \
    | filter $l.applicationname ~ 'helix-rum-collector' \
    | filter $d.cdn.domain ~ 'main--rum-integrations--adobe.aem.live' \
    | filter $d.request.id ~ 'kqam' \
    | limit 1",
    "metadata": {
      "tier": "TIER_ARCHIVE",
      "startDate": "${yesterday}",
      "endDate": "${now}"
    }}`;
  // eslint-disable-next-line no-multi-str
  const query1 = '{"query":"source logs \
      | filter $l.applicationname ~ \'helix-rum-collector\' \
      | filter $d.cdn.domain ~ \'docs.zebra.com\'", \
    "metadata": { \
        "startDate": "2024-09-19T00:00:00.00Z" \
    }}';
  console.log('Querying Coralogix with:', query);

  //         "endDate": "2024-05-29T11:30:00.00Z" \

  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <token>',
    },
    body: query,
  };

  const res = await fetch('https://ng-api-http.coralogix.com/api/v1/dataprime/query', opts);
  console.log('Response status:', res.status);
  console.log('Result:', await res.text());
});
*/
