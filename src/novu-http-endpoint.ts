import { TriggerClient, verifyRequestSignature } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({
  id: "api-reference",
  apiKey: process.env.TRIGGER_API_KEY!,
});
// end-hide-code

const novu = client.defineHttpEndpoint({
  id: "novu",
  source: "novu.co",
  icon: "novu",
  verify: async (request) => {
    if (!process.env.NOVU_SIGNING_SECRET) {
      return { success: false, reason: "No Novu Signing Secret present." }
    }
    return await verifyRequestSignature({
      request,
      algorithm: "sha256",
      headerName: 'x-novu-signature',
      secret: process.env.NOVU_SIGNING_SECRET,
    })
  },
});

client.defineJob({
  id: "http-novu",
  name: "HTTP Novu",
  version: "1.0.0",
  enabled: true,
  trigger: novu.onRequest(),
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
