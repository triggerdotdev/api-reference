import { TriggerClient } from "@trigger.dev/sdk";
import crypto from "crypto";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Create an HTTP Endpoint, with the Segment details
const segment = client.defineHttpEndpoint({
  id: "segment",
  source: "segment.com",
  icon: "segment",
  verify: async (request) => {
    const signature = request.headers.get("X-Signature");

    if (!signature) {
      return { success: false, reason: "Missing header" };
    }

    const body = await request.text();
    const bodyDigest = crypto
      .createHmac("sha1", process.env.SEGMENT_WEBHOOK_SIGNING_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== bodyDigest) {
      return { success: false, reason: "Failed sha1 verification" };
    }

    return { success: true };
  },
});

client.defineJob({
  id: "http-segment",
  name: "HTTP Segment",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: segment.onRequest(),
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
