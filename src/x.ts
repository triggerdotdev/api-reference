import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";
import { createHmac } from "crypto";
import OAuth from "oauth-1.0a";

const client = new TriggerClient({ id: "api-reference" });

// Create tokens at
// https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api
const endpointURL = "https://api.twitter.com/2/tweets";
const token = {
  key: process.env.X_ACCESS_TOKEN!,
  secret: process.env.X_ACCESS_TOKEN_SECRET!,
};

// Using OAuth 1.0a
const oauth = new OAuth({
  consumer: {
    key: process.env.X_CONSUMER_KEY!,
    secret: process.env.X_CONSUMER_SECRET!,
  },
  signature_method: "HMAC-SHA1",
  hash_function: (baseString: string, key: string) =>
    createHmac("sha1", key).update(baseString).digest("base64"),
});

// Create an authorization header
const authHeader = oauth.toHeader(
  oauth.authorize({ url: endpointURL, method: "POST" }, token)
);

// Create request options
const requestOptions: RequestInit = {
  method: "POST",
  headers: {
    Authorization: authHeader["Authorization"],
    "user-agent": "v2CreateTweetJS",
    "content-type": "application/json",
    accept: "application/json",
  },
};

client.defineJob({
  id: "tweet-x",
  name: "Tweet X",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "tweet-x",
    schema: z.object({
      text: z.string().max(280), // Tweets are limited to 280 characters
    }),
  }),
  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Tweet X",
      async () => {
        // Add the text of the Tweet you are creating
        requestOptions.body = JSON.stringify(payload);

        // Make request using Fetch API
        await fetch(endpointURL, requestOptions);
      },

      // Add metadata to the task to improve the display in the logs
      { name: "Tweet X", icon: "twitter" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
