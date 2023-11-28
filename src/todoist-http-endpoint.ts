import { createHmac } from "crypto";
import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({
  id: "api-reference",
  apiKey: process.env.TRIGGER_API_KEY!,
});
// end-hide-code

// Click on Profile > Settings > Integrations > Developer
// Click on "Build Integrations"
// Create a new app, enter the Webhook callback URL, and obtain the client_secret
// To test the app for yourself, self authenticate via
// https://developer.todoist.com/sync/v9/#webhooks:~:text=is%20not%20available).-,Webhook,-Activation%20%26%20Personal%20Use
// Create a note in Todoist to trigger the webhook
const todoist = client.defineHttpEndpoint({
  id: "todoist",
  source: "todoist.com",
  icon: "todoist",
  verify: async (request) => {
    const bodyText = await request.text()
    const hash = createHmac("sha256", process.env.TODOIST_CLIENT_SECRET!).update(bodyText).digest("base64");
    const reqHash = request.headers.get('x-todoist-hmac-sha256')
    if (hash !== reqHash) return { success: false, reason: "Failed sha256 verification." }
    return { success: true }
  }
});

client.defineJob({
  id: "http-todoist",
  name: "HTTP Todoist",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: todoist.onRequest(),
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
