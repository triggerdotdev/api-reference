import { createHmac } from "crypto";
import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({
  id: "api-reference",
  apiKey: process.env.TRIGGER_API_KEY!,
});
// end-hide-code

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
