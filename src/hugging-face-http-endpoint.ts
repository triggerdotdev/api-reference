import { TriggerClient } from "@trigger.dev/sdk";
import { createHash } from "crypto";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Go to Hugging Face Dashboard > Click on Profile > Settings
// Go to Webhooks > Add a new webhook
// Select yourself as the target
// Add the webhook URL
// Add the secret as "Test" (for example)
// Create a model from the dashboard to trigger the webhook
const huggingFace = client.defineHttpEndpoint({
  id: "hugging-face",
  source: "huggingface.co",
  icon: "hugging-face",
  verify: async (request) => {
    if (request.headers.get("x-webhook-secret") === process.env.HUGGING_FACE_WEBHOOK_SECRET) return { success: true };
    return { success: false, reason: "Webhook Secret Match Failed" };
  },
});

client.defineJob({
  id: "http-hugging-face",
  name: "HTTP Hugging Face",
  version: "1.0.0",
  enabled: true,
  trigger: huggingFace.onRequest(),
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
