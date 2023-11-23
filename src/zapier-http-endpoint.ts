import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({
  id: "api-reference",
  apiKey: process.env.TRIGGER_API_KEY!,
});
// end-hide-code

const zapier = client.defineHttpEndpoint({
  id: "zapier",
  source: "zapier.com",
  icon: "zapier",
  verify: async (request) => {
    const userAgent = request.headers.get('user-agent')
    if (!(userAgent && userAgent.includes('Zapier'))) return { success: false, reason: "The user agent does not match with Zapier" };
    const authorization = request.headers.get('authorization')
    if (process.env.ZAPIER_USER && process.env.ZAPIER_PASS) {
      if (`Basic ${btoa(`${process.env.ZAPIER_USER}:${process.env.ZAPIER_PASS}`)}` === authorization) {
        return { success: true }
      }
      return { success: false, reason: "Basic Authentication Failed" }
    }
    return { success: true }
  },
});

client.defineJob({
  id: "http-zapier",
  name: "HTTP Zapier",
  version: "1.0.0",
  enabled: true,
  trigger: zapier.onRequest(),
  run: async (request, io, ctx) => {
    const body = await request.json();
    await io.logger.info(`Body`, body);
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
import { tuple } from "zod";
createExpressServer(client);
// end-hide-code
