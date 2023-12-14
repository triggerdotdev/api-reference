import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Guide to create PagerDuty API key https://support.pagerduty.com/docs/api-access-keys
// Navigate to integrations > API Access Keys
// Click on "Create New API Key" and give it a description and click on "Create Key"
// Set the PAGERDUTY_API_KEY in the .env file.
const endpointURL = `${process.env.PAGERDUTY_BASE_URL}/addons`;

// Create request options
const requestOptions: RequestInit = {
  method: "POST",
  headers: {
    Authorization: `Token ${process.env.PAGERDUTY_API_KEY}`,
    "content-type": "application/json",
    Accept: "application/vnd.pagerduty+json;version=2",
  },
};

client.defineJob({
  id: "pagerduty-install-addon",
  name: "PagerDuty Install Addon",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "pagerduty-install-addon",
    schema: z.object({
      addon: z.object({
        type: z.string(),
        name: z.string(),
        src: z.string(),
      }),
    }),
  }),
  run: async (payload, io, ctx) => {
    const {
      addon: { type, name, src },
    } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "PagerDuty Install Addon",
      async () => {
        // Make request using Fetch API
        return await fetch(endpointURL, {
          ...requestOptions,
          body: JSON.stringify({
            type,
            name,
            src,
          }),
        }).then((response) => response.json());
      },

      // Add metadata to improve how the task displays in the logs
      { name: "PagerDuty Install Addon", icon: "pagerduty" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
