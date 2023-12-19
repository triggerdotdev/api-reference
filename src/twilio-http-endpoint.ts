import { validateRequest } from "twilio";
import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Documentation
// https://www.twilio.com/docs/usage/webhooks/sms-webhooks
// https://www.twilio.com/docs/usage/webhooks/webhooks-security

// Steps
// Get trigger HTTP endpoints set to TWILIO_WEBHOOK_URL
// Goto twilio console > Messaging > Try it out > Send a WhatsApp message and connect sandbox
// From the reference code, copy the auth token and set to TWILIO_AUTH_TOKEN
// Goto Sandbox settings and configure `When a message comes in` to the trigger HTTP endpoint
// Send a message to the whatsapp sandbox number

// Create an HTTP Endpoint, with the twilio.com details
const twilio = client.defineHttpEndpoint({
  id: "twilio.com",
  source: "twilio.com",
  icon: "twilio",
  verify: async (request) => (validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    request.headers.get("x-twilio-signature")!,
    process.env.TWILIO_WEBHOOK_URL!,
    parse(await request.text())
  ) ? {success: true}: {success: false, message: "Invalid signature"}),
});

client.defineJob({
  id: "http-twilioDotcom",
  name: "HTTP twilio.com",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: twilio.onRequest(),
  run: async (request, io, ctx) => {
    const body = parse(await request.text());
    await io.logger.info(`Body`, body);
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
import { parse } from "querystring";
createExpressServer(client);
// end-hide-code
