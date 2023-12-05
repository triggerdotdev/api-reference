import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// API Reference
// Push Notification https://developers.google.com/gmail/api/guides/push
// Verification response https://cloud.google.com/pubsub/docs/authenticate-push-subscriptions

// Steps
// Create Google Cloud Project https://console.cloud.google.com/projectcreate
// Enable Gmail API https://console.cloud.google.com/apis/library/gmail.googleapis.com
// Create gmail service account https://console.cloud.google.com/iam-admin/serviceaccounts
// Create Topic https://console.cloud.google.com/cloudpubsub/topicList and note down the topic name
// Create Subscription with the trigger endpoint. Delivery type: Push. Enable authentication and add the gmail service account email if need access grant.
// Add publish privileges to Topics: Click on the topic 3 dot (more actions) -> View permissions -> Add Principal -> New principals: gmail-api-push@system.gserviceaccount.com and set Role: Pub/Sub Publisher

// Watch request
// Open postman and setting up watch request https://developers.google.com/gmail/api/guides/push#watch_request
// Set authorization type OAuth 2.0
// Set Auth URL https://accounts.google.com/o/oauth2/auth
// Set Access Token URL https://accounts.google.com/o/oauth2/token
// Set scope https://www.googleapis.com/auth/gmail.modify
// Create OAuth client https://console.cloud.google.com/apis/credentials
// Set application type: Web application and add redirect URL https://oauth.pstmn.io/v1/callback
// Get OAuth client ID and secret and set to postman and click get access token and save.
// Now send the watch request.

// create an HTTP Endpoint, with the gmail details
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