/* eslint-disable no-console */
import assert from 'assert';
import { execSync } from 'child_process';
import { it, describe } from 'node:test';

const { GITHUB_RUN_ID } = process.env;

if (!GITHUB_RUN_ID) {
  throw new Error('Missing GITHUB_RUN_ID');
}

describe('BigQuery', () => {
  it('Check logs', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdate = yesterday.toISOString().split('T')[0];

    // Query from both the Fastly and Cloudflare driven storage and see that there are some results
    // matching the request ID
    const cmdline = `bq query --format json --nouse_legacy_sql '/* repository: adobe/rum-integrations */
      SELECT count(*) FROM (
        SELECT id FROM \`helix-225321.helix_rum.cluster\`
        WHERE TIMESTAMP_TRUNC(time, DAY) > TIMESTAMP("${yesterdate}")
        AND hostname = "main--rum-integrations--adobe.aem.live" AND id = "${GITHUB_RUN_ID}"
        UNION ALL
        SELECT id FROM \`helix-225321.helix_rum.cluster_cloudflare\`
        WHERE TIMESTAMP_TRUNC(time, DAY) > TIMESTAMP("${yesterdate}")
        AND hostname = "main--rum-integrations--adobe.aem.live" AND id = "${GITHUB_RUN_ID}"
    )'`;
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
    assert.ok(Number(val) > 0);
  });
});
