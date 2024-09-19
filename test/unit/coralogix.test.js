/* eslint-disable no-console */
import assert from 'assert';
import { it, describe } from 'node:test';

const { JOB_ID, CORALOGIX_TOKEN } = process.env;

if (!JOB_ID) {
  throw new Error('Missing JOB_ID');
}
if (!CORALOGIX_TOKEN) {
  throw new Error('Missing CORALOGIX_TOKEN');
}

describe('Coralogix', () => {
  it('Check logs', async () => {
    const now = new Date().toISOString();
    const lasthour = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const query = `{"query":"source logs \
    | filter $l.applicationname ~ 'helix-rum-collector' \
    | filter $d.cdn.domain ~ 'main--rum-integrations--adobe.aem.live' \
    | filter $d.request.id ~ '${JOB_ID}' \
    | limit 1",
    "metadata": {
      "tier": "TIER_ARCHIVE",
      "startDate": "${lasthour}",
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
      throw new Error('No result with log records found in Coralogix response, expected at least one');
    }

    const json = JSON.parse(result);
    const results = json.result?.results;
    if (!results || results.length === 0) {
      throw new Error('No log records found in Coralogix response, expected at least one');
    }

    const userdata = JSON.parse(results[0].userData);
    console.log('Userdata:', userdata);
    assert.equal('https://main--rum-integrations--adobe.aem.live/', userdata.cdn.url);
  });
});
