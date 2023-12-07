import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Zapier webhook article https://help.zapier.com/hc/en-us/articles/8496288690317
// Steps
// Create Zaps app and create a Google Sheet with first field name for save name
// 1. Set trigger to Webhooks by Zapier
//  1a. Event: catch hook; Trigger child key: name
//  1b. POST a request with JSON `[{"name": "TriggerDotDev"}]` to webhook URL then find records ans select request and continue
// 2. Set action to Google Sheets
//  2a. Event: Create Spreadsheet Row
//  2b. Set your Google account
//  2c. Drive: My Google Drive; Spreadsheet: Set your Google sheet; Worksheet: Sheet1; Name: Catch Hook in Webhooks by Zapier name field; Test and publish
// 3. Copy webhook URL and add .env to ZAPIER_WEBHOOK

client.defineJob({
  id: "zapier-store-name",
  name: "Zapier store name",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "zapier-store-name",
    schema: z.object({
      name: z.string().max(50), // Full name that you want to store
    }),
  }),
  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Zapier store name",
      async () => {
        // Make request using Fetch API to Zapier webhook
        return await fetch(process.env.ZAPIER_WEBHOOK!, {
          method: "POST",
          body: JSON.stringify([payload]),
        }).then((response) => response.json());
      },
      // Add metadata to improve how the task displays in the logs
      { name: "Zapier store name", icon: "zapier" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
