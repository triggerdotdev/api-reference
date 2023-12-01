import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Docs https://developers.google.com/gmail/api/guides/push#protocol
// Verification response https://cloud.google.com/pubsub/docs/authenticate-push-subscriptions

//create an HTTP Endpoint, with the gmail details
export const gmail = client.defineHttpEndpoint({
  id: "gmail.com",
  title: "gmail",
  source: "gmail.com",
  icon: "gmail",
  verify: async (request) => {
    // Getting bearer token from request
    const bearer = request.headers.get("Authorization");
    if (!bearer) {
      return { success: false, reason: "No bearer token" };
    }
    const tokens = bearer.match(/Bearer (.*)/);
    if (!tokens || tokens.length < 2) {
      return { success: false, reason: "Invalid bearer token" };
    }
    const token = tokens[1];

    // Verifying token
    const data = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const payload = await data.json();
    if (payload.email === process.env.GMAIL_SERVICE_ACCOUNT_EMAIL) {
      return { success: true };
    }

    return { success: false, reason: "Invalid token" };
  },
});

client.defineJob({
  id: "http-gmail",
  name: "HTTP gmail",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: gmail.onRequest(),
  run: async (request, io, ctx) => {
    const body = await request.json();
    const message = Buffer.from(body.message.data, 'base64').toString('utf-8');
    await io.logger.info(`Body`, JSON.parse(message));
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code