import { TriggerClient } from "@trigger.dev/sdk";
import { createHmac } from "crypto";

// hide-code
const client = new TriggerClient({
  id: "api-reference",
  apiKey: process.env.TRIGGER_API_KEY!,
});
// end-hide-code

// Go to your normal Mailgun account
// Create a private app in Sending > Webhooks
// With scope: Delivered
// And add your trigger webhooks url in target url
// Obtain the Webhook Key on the right of your window

// Create an HTTP Endpoint, with the Mailgun details
const mailgun = client.defineHttpEndpoint({
  id: "mailgun",
  source: "mailgun.com",
  icon: "mailgun",
  verify: async (request) => {
    const body = await request.json();
    const { timestamp, token, signature } = body.signature;
    const mailgunKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (!mailgunKey)
      return { success: false, reason: "Missing mailgun webhook signing key" };
    if (!timestamp || !token)
      return {
        success: false,
        reason: "Missing signature fields in request body",
      };
    const hash = createHmac("sha256", mailgunKey)
      .update(timestamp + token)
      .digest("hex");
    const success = hash === signature;
    if (success) return { success };
    return { success: false, reason: "Failed sha256 verification" };
  },
});

// Job that runs when the HTTP endpoint is called from Mailgun when an email is sent
client.defineJob({
  id: "http-mailgun",
  name: "HTTP Mailgun",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: mailgun.onRequest(),
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
