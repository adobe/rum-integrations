# End-to-End testing project for RUM

This repository contains

* A sample Edge Delivery Services website which can be accessed from https://main--rum-integrations--adobe.aem.live/ - This is a basic Edge Delivery Services site for which the code for this can be found in this directory (blocks/scripts/styles etc)
* A testcomponent which accesses this site using Playwright and then checks that the request has appeared in the Google BigQuery database. This is located in test/pw. It forces the RUM collections to go via a specific backend, currently always Fastly. Cloudflare is TODO.
* A test component which checks the Coralogix database that the log entries for the request made earlier have arrived.
* A GitHub Actions workflow which runs everything. Because of time delays between making the request and it being visible in Coralogix, these actions are split into two test jobs, where the second one waits 15 minutes before checking that the logs have arrived.

The tests in this project are automatically run on a schedule and can be found in the [Actions](actions)
section.

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Running the Playwright tests locally

These are run from the `test/pw` directory.

Make sure that the Playwright prerequisites are present by running:

```
test/pw $> npm i
test/pw $> npm run test:install
```

You also need the Google Cloud SDK installed from here: https://cloud.google.com/sdk/docs/install-sdk
This will give you the `gcloud` command to log in and the `bq` command to access BigQuery.

Before running the tests log into gcloud with:

```
gcloud auth login
gcloud config set project helix-225321
```

Then run the Playwright tests with
```
test/pw $> npm t
```

## Running the Coralogix checks tests locally

The Coralogix tests need 2 environment variables to be set.

* `JOB_ID`: is the ID of the job to check, from an existing Github Action run. You can find the job ID in the github action URL like here https://github.com/adobe/rum-integrations/actions/runs/1234567890 or as the environment variable set during the action execution: `$GITHUB_RUN_ID`
* `CORALOGIX_TOKEN`: this is needed in order to access Coralogix and is set as a secret in the repository.

To run the tests locally, provide values for these 2 variables on the commandline:

```
JOB_ID=1234567890 CORALOGIX_TOKEN=... npm t
```

## Launching the site locally

1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
