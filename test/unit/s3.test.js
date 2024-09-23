/* eslint-disable no-console */
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import assert from 'assert';
import { it, describe } from 'node:test';
import { gunzipSync } from 'node:zlib';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, JOB_ID } = process.env;

if (!AWS_ACCESS_KEY_ID) {
  throw new Error('Missing AWS_ACCESS_KEY_ID');
}
if (!AWS_SECRET_ACCESS_KEY) {
  throw new Error('Missing AWS_SECRET_ACCESS_KEY');
}
if (!JOB_ID) {
  throw new Error('Missing JOB_ID');
}

async function getObjectNames(client, date, addfactor) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();

  const objNames = new Map();
  const loin = {
    Bucket: 'helix-rum-bundles',
    Delimiter: '/',
    Prefix: `main--rum-integrations--adobe.aem.live/${y}/${m}/${day}/`,
  };
  const loc = new ListObjectsV2Command(loin);
  try {
    const resp = await client.send(loc);
    resp.Contents.forEach((obj) => {
      const fname = obj.Key.split('/').pop();
      const fnum = fname.split('.').shift();
      if (fnum.length > 0) {
        try {
          const num = Number(fnum); // see if it's a number
          objNames.set(num + addfactor, obj.Key);
        } catch (err) {
          console.log('Not a number', fnum);
        }
      }
    });

    const objMap = new Map([...objNames.entries()].sort((a, b) => b[0] - a[0]));
    console.log('Found object names:', objMap);
    return objMap;
  } catch (err) {
    console.log('Error:', err);
    throw err;
  }
}

async function getFiles(client) {
  const date = new Date();
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);

  const files = await getObjectNames(client, date, 1000);
  const files2 = await getObjectNames(client, yesterday, 0);
  return new Map([...files, ...files2]);
}

describe('S3', () => {
  it('Check log recors', async () => {
    const client = new S3Client({
      region: 'us-east-1',
      endpoint: 'https://s3.amazonaws.com',
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const objNames = await getFiles(client);
    // eslint-disable-next-line no-restricted-syntax, no-unused-vars
    for (const [ord, objName] of objNames) {
      console.log('Reading ', objName);
      const input = {
        Bucket: 'helix-rum-bundles',
        Key: objName,
      };
      const command = new GetObjectCommand(input);

      try {
        // eslint-disable-next-line no-await-in-loop
        const resp = await client.send(command);
        // eslint-disable-next-line no-await-in-loop
        const body = await resp.Body.transformToByteArray();
        const unzipped = gunzipSync(body);
        const json = JSON.parse(unzipped.toString());

        // eslint-disable-next-line no-restricted-syntax
        for (const key of Object.keys(json.bundles)) {
          const bundle = json.bundles[key];
          console.log('Found ID:', bundle.id);
          if (bundle.id === JOB_ID) {
            assert.equal(bundle.url, 'https://main--rum-integrations--adobe.aem.live/');
            console.log('Found matching record:', bundle);
            return; // Found it, all good.
          }
        }
      } catch (err) {
        console.log('Error:', err);
        throw err;
      }
    }
    throw new Error('No log matching records found in S3 response, expected at least one');
  });
});
