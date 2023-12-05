import { TriggerClient, verifyRequestSignature } from "@trigger.dev/sdk";
import { Slack } from "@trigger.dev/slack";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeStyle: "short",
});

const slack = new Slack({ id: "slack" });

// Create an HTTP Endpoint, with the cal.com details
const caldotcom = client.defineHttpEndpoint({
  id: "cal.com",
  source: "cal.com",
  icon: "caldotcom",
  verify: async (request) => {
    return await verifyRequestSignature({
      request,
      headerName: "X-Cal-Signature-256",
      secret: process.env.CALDOTCOM_SECRET!,
      algorithm: "sha256",
    });
  },
});

// This job sends a Slack message when meetings are booked or canceled
client.defineJob({
  id: "http-caldotcom",
  name: "HTTP Cal.com",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: caldotcom.onRequest(),
  integrations: {
    slack,
  },
  run: async (request, io, ctx) => {
    const body = await request.json();
    await io.logger.info(`Body`, body);

    const attendees = body.payload.attendees
      .map((attendee: any) => attendee.email)
      .join(", ") as string[];

    const startTime = dateFormatter.format(new Date(body.payload.startTime));
    const endTime = timeFormatter.format(new Date(body.payload.endTime));

    switch (body.triggerEvent) {
      case "BOOKING_CREATED": {
        await io.slack.postMessage("booking-created", {
          channel: process.env.SLACK_CHANNEL!,
          text: `Meeting booked:\n ${attendees} \n ${startTime}—${endTime}`,
        });
        break;
      }
      case "BOOKING_CANCELLED": {
        await io.slack.postMessage("booking-cancelled", {
          channel: process.env.SLACK_CHANNEL!,
          text: `Meeting canceled:\n ${attendees} \n ${startTime}—${endTime}`,
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
