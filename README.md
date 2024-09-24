# End-to-End testing project for RUM

This repository contains

* A sample Edge Delivery Services website, based on the standard boilerplate, which can be accessed from https://main--rum-integrations--adobe.aem.live/ - This is a basic Edge Delivery Services site for which the code for this can be found in this directory (blocks/scripts/styles etc). The one modifiction made to this site is that is the
`test_rum_id` URL parameter is passed in, this is set as the RUM ID, so that it can be searched for in the results.
* A testcomponent which accesses this site using Playwright to trigger the RUM request. This is located in `test/pw`.
* A test component written as a unit test which checks that the request has appeared in the Google BigQuery database. Located in `test/unit/bigquery.test.js`.
* A test component which checks the Coralogix database that the log entries for the request made earlier have arrived. This can be found in `test/unit/coralogix.test.js`.
* A test component which checks the S3 backend that the log entries have arrived there. This can be found in `test/unit/coralogix.test.js`.
* A GitHub Actions workflow which runs everything. It selects either Fastly and Cloudflare backends by modifying the `/etc/hosts` file on the test environment to point to a
specific worker backend. Some tests are run without modifying `/etc/hosts` to let the usual DNS randomization do its work. The workflow is split up in a component that
generates the data, and then multiple workflows that check the backends. Depending on the worker platform and backend used, data is forwarded to the backends only periodically
so waits of up to an hour are sometimes needed before the check can be made.

The tests in this project are automatically run on a schedule and can be found in the
[Actions](https://github.com/adobe/rum-integrations/actions)
section.

## Installation

```sh
npm i
```


## Running the Playwright tests locally

These are run from the `test/pw` directory. These produce the data that goes into RUM.

Make sure that the Playwright prerequisites are present by running:

```
test/pw $> npm i
test/pw $> npm run test:install
```

The Playwright tests expect a Github Action Run ID when running. This is normally a large base-10 number. Set one as the `GITHUB_RUN_ID`
env var, then run the Playwright tests with
```
test/pw $> GITHUB_RUN_ID=123456789 npm t
```

## Running the Google BigQuery checks locally

You also need the Google Cloud SDK installed from here: https://cloud.google.com/sdk/docs/install-sdk
This will give you the `gcloud` command to log in and the `bq` command to access BigQuery.

Before running the tests log into gcloud with:

```
gcloud auth login
gcloud config set project helix-225321
```

Then run the tests by providing the RUN id as:

```
$> GITHUB_RUN_ID=123456789 npm t test/unit/bigquery.test.js
```

## Running the Coralogix checks locally

The Coralogix tests need 2 environment variables to be set.

* `GITHUB_RUN_ID`: is the ID of the run to check, from an existing Github Action run. You can find the ID in the github action URL like here https://github.com/adobe/rum-integrations/actions/runs/1234567890 or as the environment variable set during the action execution: `$GITHUB_RUN_ID`
* `CORALOGIX_TOKEN`: this is needed in order to access Coralogix and is set as a secret in the repository.

To run the tests locally, provide values for these 2 variables on the commandline:

```
GITHUB_RUN_ID=1234567890 CORALOGIX_TOKEN=... npm t test/unit/coralogix.test.js
```

## Running the S3 checks locally

The S3 checks use the AWS S3 client API to access S3 and read the data stored there.

It requires the `GITHUB_RUN_ID` to be set, as well as the usual AWS credentials `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Set these as environment variables,
then run the tests with:

```
npm t test/unit/s3.test.js
```

## Launching the site locally

1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
