<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://imagedelivery.net/3TbraffuDZ4aEf8KWOmI_w/a45d1fa2-0ae8-4a39-4409-f4f934bfae00/public">
  <source media="(prefers-color-scheme: light)" srcset="https://imagedelivery.net/3TbraffuDZ4aEf8KWOmI_w/3f5ad4c1-c4c8-4277-b622-290e7f37bd00/public">
  <img alt="Trigger.dev logo" src="https://imagedelivery.net/3TbraffuDZ4aEf8KWOmI_w/a45d1fa2-0ae8-4a39-4409-f4f934bfae00/public">
</picture>

---

# Trigger.dev API references

This repository provides job code samples that use either SDKs or the `fetch` method to interact with external APIs and Trigger.dev. Refer to these examples if you're working with APIs that don't have an official Trigger.dev integration yet.

For a full list of our official supported integrations please refer to [our integration docs](https://trigger.dev/docs/integrations/introduction):

## About Trigger.dev

Trigger.dev is a framework for creating long-running Jobs directly in your Next.js app with API integrations, webhooks, scheduling and delays. You can reliably run Jobs that wouldn’t normally work in serverless environments (like Vercel) because of timeouts.

## Jobs in this repo:

These jobs can be run locally using the `@trigger.dev/cli` and `@trigger.dev/express` packages.

## Setup: how to use this repo

You will need to create a `.env` file. You can duplicate the contents of `.env.example` file and set your local (Dev 'server') `TRIGGER_API_KEY` value. You can find your API key in your project's integrations page [in the app](https://cloud.trigger.dev). Add other API keys as needed.

### Install packages

First, install the packages:

```sh
npm i
```

### Running a job

Each file in `src` is either a Job or a separate set of jobs that can be run separately. For example, the `src/cronScheduledBasic.ts` file can be run with:

```sh
npm run github
```

This will open up a local server using `express` on port 8080. Then in a <u>separate terminal window</u> you can run the `@trigger.dev/cli dev` command:

```sh
npm run dev:trigger
```

### Contributors guide

You can add a new file to `src` with it's own `TriggerClient` and set of jobs (e.g. `src/events.ts`)

```ts
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { createExpressServer } from "@trigger.dev/express";
import { z } from "zod";

export const client = new TriggerClient({ id: "api-reference" });

client.defineJob({
  id: "example-job",
  name: "Example Job",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "example.one",
  }),
  run: async (payload, io, ctx) => {},
});

createExpressServer(client);
```

Then add a new script in [`package.json`](./package.json):

```json
{
  "scripts": {
    "events": "nodemon --watch src/events.ts -r tsconfig-paths/register -r dotenv/config src/events.ts"
  }
}
```
