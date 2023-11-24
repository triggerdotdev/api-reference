import { TriggerClient, verifyRequestSignature } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// WhatsApp
const whatsApp = client.defineHttpEndpoint({
  id: "whatsapp",
  source: "whatsapp.com",
  icon: "whatsapp",
  // This is only needed for certain APIs like WhatsApp which don't setup the webhook until you pass the test
  respondWith: {
    // Don't trigger runs if they match this filter
    skipTriggeringRuns: true,
    filter: {
      method: ["GET"],
      query: {
        "hub.mode": [{ $startsWith: "sub" }],
      },
    },
    handler: async (request, verify) => {
      const searchParams = new URL(request.url).searchParams;
      if (
        searchParams.get("hub.verify_token") !==
        process.env.WHATSAPP_WEBHOOK_SECRET
      ) {
        return new Response("Unauthorized", { status: 401 });
      }
      return new Response(searchParams.get("hub.challenge") ?? "OK", {
        status: 200,
      });
    },
  },
  verify: async (request) => {
    return await verifyRequestSignature({
      request,
      headerName: "x-hub-signature-256",
      secret: process.env.WHATSAPP_APP_SECRET!,
      algorithm: "sha256",
      xp,
    });
  },
});

client.defineJob({
  id: "http-whatsapp",
  name: "HTTP WhatsApp",
  version: "1.1.0",
  enabled: true,
  trigger: whatsApp.onRequest(),
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
