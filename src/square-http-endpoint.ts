import { TriggerClient } from "@trigger.dev/sdk";
import { WebhooksHelper } from "square";
import { Slack } from "@trigger.dev/slack";

// hide-code
const client = new TriggerClient({
  id: "api-reference",
  apiKey: process.env.TRIGGER_API_KEY!,
});
// end-hide-code

const slack = new Slack({ id: "slack" });

// Go to your Square developer account
// Create and open an application
// Go to Webhooks > Subscriptions
// Add a subscription and add your trigger webhooks url in url field
// Select events you want to be notified about
// Save the webhook
// Obtain the Webhook Signature Key and Notification URL

// Create an HTTP Endpoint, with the Square details
const square = client.defineHttpEndpoint({
  id: "square",
  source: "square.com",
  icon: "square",
  verify: async (request) => {
    const body = await request.text();

    const isFromSquare = WebhooksHelper.isValidWebhookEventSignature(
      body,
      request.headers.get("x-square-hmacsha256-signature") ?? "",
      process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "",
      process.env.SQUARE_WEBHOOK_NOTIFICATION_URL ?? ""
    );

    if (!isFromSquare) {
      return {
        success: false,
        reason: "Invalid Square Signature",
      };
    } else {
      return {
        success: true,
      };
    }
  },
});

//Our job sends a Slack message when customer is created or deleted
client.defineJob({
  id: "http-square",
  name: "HTTP Square",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: square.onRequest(),
  integrations: {
    slack,
  },
  run: async (request, io, ctx) => {
    const body = await request.json();
    await io.logger.info(`Body`, body);

    const customer = body.data.object.customer;

    switch (body.type) {
      case "customer.created": {
        await io.slack.postMessage("customer-created", {
          channel: process.env.SLACK_CHANNEL!,
          text: `Customer created:\n ${customer.given_name} ${customer.family_name}`,
        });
        break;
      }
      case "customer.deleted": {
        await io.slack.postMessage("customer-deleted", {
          channel: process.env.SLACK_CHANNEL!,
          text: `Customer deleted:\n ${customer.given_name} ${customer.family_name}`,
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
