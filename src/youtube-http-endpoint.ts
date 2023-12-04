import { TriggerClient } from "@trigger.dev/sdk";
import { createHmac } from "crypto";
import { XMLParser } from "fast-xml-parser";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Docs: https://developers.google.com/youtube/v3/guides/push_notifications

// Go to https://pubsubhubbub.appspot.com/subscribe and enter the following details:
// callback URL is trigger.dev endpoint URL
// Topic URL is https://www.youtube.com/xml/feeds/videos.xml?channel_id=CHANNEL_ID (replace CHANNEL_ID with your channel ID)
// Select Verify Type as Synchronous
// Choose mode as subscribe
// For Verify Token and HMAC secret, enter the secret from the trigger.dev dashboard

//create an HTTP Endpoint, with the YouTube details
export const youtube = client.defineHttpEndpoint({
  id: "youtube.com",
  title: "YouTube",
  source: "youtube.com",
  icon: "youtube",
  respondWith: {
    // Don't trigger runs if they match this filter
    skipTriggeringRuns: true,
    filter: {
      query: {
        "hub.mode": [{ $endsWith: "subscribe" }],
      },
    },
    handler: async (request, verify) => {
      const searchParams = new URL(request.url).searchParams;

      if (
        searchParams.get("hub.verify_token") !==
        process.env.YOUTUBE_SIGNING_SECRET
      ) {
        return new Response("Unauthorized", { status: 401 });
      }
      return new Response(searchParams.get("hub.challenge") ?? "OK", {
        status: 200,
      });
    },
  },
  verify: async (request) => {
    const signature = request.headers.get("x-hub-signature");

    if (!signature) {
      return { success: false, reason: "Missing header" };
    }

    const secret = process.env.YOUTUBE_SIGNING_SECRET;

    if (!secret) {
      return { success: false, reason: "Missing secret" };
    }

    const [algorithm, hash] = signature.split("=");
    const body = await request.text();
    const digest = createHmac(algorithm, secret).update(body).digest("hex");

    if (hash !== digest) {
      return { success: false, reason: "Failed sha1 verification" };
    }

    return { success: true };
  },
});

client.defineJob({
  id: "http-youtube",
  name: "HTTP YouTube",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: youtube.onRequest(),
  run: async (request, io, ctx) => {
    const body = await request.text();
    const parser = new XMLParser();
    const jObj = parser.parse(body);
    await io.logger.info(`Body`, jObj);
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
