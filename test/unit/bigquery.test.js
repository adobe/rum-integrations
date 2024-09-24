/* eslint-disable no-console */
import assert from 'assert';
import { execSync } from 'child_process';
import { it, describe } from 'node:test';

const { GITHUB_RUN_ID: JOB_ID } = process.env;

if (!JOB_ID) {
  throw new Error('Missing JOB_ID');
}

describe('BigQuery', () => {
  it('Check logs', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdate = yesterday.toISOString().split('T')[0];

    const cmdline = `bq query --format json --nouse_legacy_sql '/* repository: adobe/rum-integrations */
      SELECT count(*) FROM \`helix-225321.helix_rum.cluster\`
      WHERE TIMESTAMP_TRUNC(time, DAY) > TIMESTAMP("${yesterdate}")
      AND hostname = "main--rum-integrations--adobe.aem.live" AND id = "${JOB_ID}" LIMIT 1'`;
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
