import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Apps Script Docs: https://developers.google.com/apps-script/reference
// Triggers Docs: https://developers.google.com/apps-script/guides/triggers

// Create an HTTP Endpoint, with the Google Docs details
// (This will create the endpoint URL and Secret on the `trigger.dev` dashboard)

// Open your Google Docs document
// Go to Extensions > Apps Script
// create a new script with function that makes a POST request to the endpoint URL
// with x-webhook-secret header and the event data as the body
// Go to Triggers > Add Trigger > Select "select event type" > Save

const docs = client.defineHttpEndpoint({
  id: "google-docs",
  source: "google-docs",
  icon: "google",
  verify: async (request) => {
    const secret = process.env.GOOGLE_DOCS_WEBHOOK_SECRET;
    if (!secret) return { success: false, reason: "Missing Secret" };
    if (request.headers.get("x-webhook-secret") === secret)
      return { success: true };
    return { success: false, reason: "Webhook Secret Match Failed" };
  },
});

client.defineJob({
  id: "http-google-docs",
  name: "HTTP Google Docs",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: docs.onRequest(),
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
