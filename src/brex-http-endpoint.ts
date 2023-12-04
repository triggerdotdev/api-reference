import { TriggerClient } from "@trigger.dev/sdk";
import { createHmac, timingSafeEqual } from "crypto";
import { Slack } from "@trigger.dev/slack";

// hide-code
const client = new TriggerClient({
  id: "api-reference",
  apiKey: process.env.TRIGGER_API_KEY!,
});
// end-hide-code

const slack = new Slack({ id: "slack" });

// API KEY Docs: https://developer.brex.com/docs/authentication/
// Sign in to dashboard.brex.com as an account admin .
// Go to Developer > Settings .
// Click Create Token .
// Add a name for your token and choose level of data access you need for your app; then click Create Token.

// Webhooks Docs: https://developer.brex.com/openapi/webhooks_api/

//create an HTTP Endpoint, with the Brex details
const brex = client.defineHttpEndpoint({
  id: "brex",
  source: "brex",
  icon: "brex",
  verify: async (request) => {
    const webhook_id = request.headers.get("Webhook-Id");
    const webhook_signature = request.headers.get("Webhook-Signature");
    const webhook_timestamp = request.headers.get("Webhook-Timestamp");
    const body = await request.text();

    if (!webhook_id || !webhook_signature || !webhook_timestamp) {
      return { success: false, reason: "Missing brex headers" };
    }

    const signed_content = `${webhook_id}.${webhook_timestamp}.${body}`;
    const passed_signatures = webhook_signature
      .split(" ")
      .map((sigString) => sigString.split(",")[1]);

    const response = await fetch(
      `https://platform.brexapis.com/v1/webhooks/secrets`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BREX_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    const secrets = data.map(
      (secretObj: { secret: string; status: string }) => secretObj.secret
    );

    for (const secret of secrets) {
      const base64DecodedSecret = Buffer.from(secret, "base64");
      const hmac = createHmac("sha256", base64DecodedSecret);
      const computed_signature = hmac.update(signed_content).digest();

      for (const passed_signature of passed_signatures) {
        const decodedPassedSignature = Buffer.from(passed_signature, "base64");

        if (timingSafeEqual(computed_signature, decodedPassedSignature)) {
          return { success: true };
        }
      }
    }

    return { success: false, reason: "Invalid brex signature" };
  },
});

//Our job sends a Slack message when a user is updated
client.defineJob({
  id: "http-brex",
  name: "HTTP Brex",
  version: "1.0.0",
  enabled: true,
  //create a trigger from the HTTP endpoint
  trigger: brex.onRequest(),
  integrations: {
    slack,
  },
  run: async (request, io, ctx) => {
    const body = await request.json();
    await io.logger.info(`Body`, body);

    switch (body.event_type) {
      case "USER_UPDATED": {
        await io.slack.postMessage("user-updated", {
          channel: process.env.SLACK_CHANNEL!,
          text: `User updated:\nUser id: ${
            body.user_id
          }\nUpdated attributes: ${body.updated_attributes.join(", ")}`,
        });
        break;
      }
    }
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
