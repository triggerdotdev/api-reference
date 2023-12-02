import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Apps Script Docs: https://developers.google.com/apps-script/reference
// Triggers Docs: https://developers.google.com/apps-script/guides/triggers

// Open your Google Sheets document
// Go to Extensions > Apps Script
// Get endpoint URL and secret from `trigger.dev` dashboard
// create a new script with function that makes a POST request to the endpoint URL
// with x-webhook-secret header and the event data as the body
// Go to Triggers > Add Trigger > Select "select event type" > Save

// Create an HTTP Endpoint, with the Google Sheets details
const sheets = client.defineHttpEndpoint({
  id: "google-sheets",
  source: "google-sheets",
  icon: "google",
  verify: async (request) => {
    const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
    if (!secret) return { success: false, reason: "Missing Secret" };
    if (request.headers.get("x-webhook-secret") === secret)
      return { success: true };
    return { success: false, reason: "Webhook Secret Match Failed" };
  },
});

client.defineJob({
  id: "http-google-sheets",
  name: "HTTP Google Sheets",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: sheets.onRequest(),
  run: async (request, io, ctx) => {
    const body = await request.json();
    await io.logger.info(`Body`, body);
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
