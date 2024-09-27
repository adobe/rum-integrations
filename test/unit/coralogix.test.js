/* eslint-disable no-console */
import assert from 'assert';
import { it, describe } from 'node:test';

const { GITHUB_RUN_ID, CORALOGIX_TOKEN } = process.env;

if (!GITHUB_RUN_ID) {
  throw new Error('Missing GITHUB_RUN_ID');
}
if (!CORALOGIX_TOKEN) {
  throw new Error('Missing CORALOGIX_TOKEN');
}

async function runCoralogixQuery(baseQuery) {
  const now = new Date().toISOString();
  const previous = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  const query = `{"query":"${baseQuery}",
  "metadata": {
    "tier": "TIER_ARCHIVE",
    "startDate": "${previous}",
    "endDate": "${now}"
  }}`;
  console.log('Querying Coralogix with:', query);

  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CORALOGIX_TOKEN}`,
    },
    body: query,
  };

  const res = await fetch('https://ng-api-http.coralogix.com/api/v1/dataprime/query', opts);
  console.log('Response status:', res.status);
  const responseText = await res.text();
  console.log('Result:', await responseText);

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
    return undefined;
  }

  const json = JSON.parse(result);
  return json.result?.results;
}

function checkApplicationLabel(cfRes, cloudFlare) {
  const { labels } = cfRes;
  let foundApplicationName = false;
  // eslint-disable-next-line no-restricted-syntax
  for (const label of labels) {
    if (label.key === 'applicationname') {
      console.log('Found application name:', label.value);
      if (cloudFlare) {
        assert.equal('Cloudflare', label.value, 'Expected record to be marked as coming from Cloudflare');
      } else {
        assert.notEqual('Cloudflare', label.value, 'Expected record to be marked as coming NOT from Cloudflare');
      }
      foundApplicationName = true;
      break;
    }
  }
  assert.ok(foundApplicationName, 'Label not found "applicationname"');
}

describe('Coralogix', () => {
  it('Check logs', async () => {
    let results = await runCoralogixQuery(`source logs \
      | filter $l.applicationname ~ 'helix-rum-collector' \
      | filter $d.cdn.domain ~ 'main--rum-integrations--adobe.aem.live' \
      | filter $d.request.id ~ '${GITHUB_RUN_ID}' \
      | limit 1`);

    if (results && results.length > 0) {
      checkApplicationLabel(results[0], false);

      const userdata = JSON.parse(results[0].userData);
      console.log('Userdata:', userdata);
      assert.equal('https://main--rum-integrations--adobe.aem.live/', userdata.cdn.url);
      assert.equal(userdata.request.id, GITHUB_RUN_ID);
    } else {
      console.log('Nothing found in the Fastly storage, trying Cloudflare');

      results = await runCoralogixQuery(`source logs \
        | filter $l.applicationname ~ 'Cloudflare' \
        | filter $d.ScriptName ~ 'helix3--helix-rum-collector-prod' \
        | filter $d.rum.url ~ 'https://main--rum-integrations--adobe.aem.live/' \
        | filter $d.rum.id ~ '${GITHUB_RUN_ID}' \
        | limit 1`);

      checkApplicationLabel(results[0], true);

      const userdata = JSON.parse(results[0].userData);
      assert.equal(userdata.rum.id, GITHUB_RUN_ID);
      assert.ok(userdata.rum.url.startsWith('https://main--rum-integrations--adobe.aem.live/'));
    }

    if (!results || results.length === 0) {
      throw new Error('No log records found in Coralogix response, expected at least one');
    }
  });
});
