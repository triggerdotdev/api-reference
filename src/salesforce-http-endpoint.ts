import { TriggerClient, verifyRequestSignature } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Create an HTTP Endpoint to listen to Salesforce webhooks
// (This will create the endpoint URL and Secret on the `trigger.dev` dashboard)
// Salesforce does not have built-in webhooks. `Object Triggers` and `Callouts` can be used to simulate them.
// Setup the `Trigger` on the required Object. The `Callout` has to be marked async in order to work.
// The `Callout` has to execute an HTTP request to the endpoint URL on the dashboard with the necessary data.
// It has to compute a Hmac sign for the webhook body using the Secret from `trigger.dev` dashboard.
// Set the `SF_WEBHOOK_SIGNING_SECRET` (Secret) in the .env file.
const salesforce = client.defineHttpEndpoint({
  id: "salesforce",
  source: "salesforce.com",
  icon: "salesforce",
  verify: async (request) => {
    return await verifyRequestSignature({
      request,
      headerName: "X-SF-Signature-256",
      secret: process.env.SF_WEBHOOK_SIGNING_SECRET!,
      algorithm: "sha256",
    });
  },
});

client.defineJob({
  id: "http-salesforce",
  name: "HTTP Salesforce",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: salesforce.onRequest(),
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
