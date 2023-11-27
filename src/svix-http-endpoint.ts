import { Webhook } from "svix";
import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({
  id: "api-reference",
  apiKey: process.env.TRIGGER_API_KEY!,
});
// end-hide-code

// Go to dashboard.svix.com > Operational Webhooks
// Create an endpoint with the Webhook URL
// Obtain the Signing Secret from the right
// To trigger the webhook, Testing > Send Event > Send Example
const svix = client.defineHttpEndpoint({
  id: "svix",
  source: "svix.com",
  icon: "svix",
  verify: async (request) => {
    const body = await request.text();
    const svixID = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')
    if (!svixID || !svixTimestamp || !svixSignature) {
      return { success: false, reason: "Svix headers are missing" }
    }
    const headers = {
      "svix-id": svixID,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature
    };
    const wh = new Webhook(process.env.SVIX_SECRET_KEY!);
    try {
      // below throws an error if not matching, hence put in try/catch
      wh.verify(body, headers);
      return { success: true }
    }
    catch (e) {
      console.log(e)
      return { success: false, reason: "Svix verification failed due to " + (e.message || e.toString()) }
    }
  },
});

client.defineJob({
  id: "http-svix",
  name: "HTTP Svix",
  version: "1.0.0",
  enabled: true,
  trigger: svix.onRequest(),
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
