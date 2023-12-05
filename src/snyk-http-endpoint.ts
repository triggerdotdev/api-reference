import { TriggerClient, verifyRequestSignature } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Create an HTTP endpoint to listen to Snyk webhooks
// (This will create the endpoint URL & Secret on the `trigger.dev` dashboard)
// Create a Snyk webhook by providing the endpoint URL & Secret (Copy from the dashboard) in the request body.
// Use https://snyk.docs.apiary.io/#reference/webhooks/webhook-collection/create-a-webhook?console=1
// Set the `SNYK_WEBHOOK_SIGNING_SECRET` (Secret) in the .env file.
const snyk = client.defineHttpEndpoint({
  id: "snyk",
  source: "snyk.com",
  icon: "snyk",
  verify: async (request) => {
    return await verifyRequestSignature({
      request,
      headerName: "x-hub-signature",
      secret: process.env.SNYK_WEBHOOK_SIGNING_SECRET!,
      algorithm: "sha256",
    });
  },
});

client.defineJob({
  id: "http-snyk",
  name: "HTTP Snyk",
  version: "1.0.0",
  enabled: true,
  trigger: snyk.onRequest(),
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
