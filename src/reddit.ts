import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";
import { stringify } from "querystring";

const client = new TriggerClient({ id: "api-reference" });

const accessTokenEndpointURL = "https://www.reddit.com/api/v1/access_token";
const endpointURL = "https://oauth.reddit.com/api/submit"; // Use this endpoint to submit a post on Reddit. https://www.reddit.com/dev/api#POST_api_submit

// Get the Reddit client id and secret follow the instructions here:
// https://github.com/reddit-archive/reddit/wiki/OAuth2
const accessTokenRequestOptions: RequestInit = {
  method: "POST",
  body: stringify({
    grant_type: "password",
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  }),
  headers: {
    Authorization: `Basic ${Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
};

// Create an authorization header global scope
let requestOptions: RequestInit | undefined;

client.defineJob({
  id: "reddit-post",
  name: "Reddit Post",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "reddit-post",
    schema: z.object({
      title: z.string().max(300), // Title of the post
      text: z.string().max(10000), // Raw markdown text
      sr: z.string(), // The subreddit to submit to. Ex: "api_reference"
      kind: z
        .enum(["link", "self", "image", "video", "videogif"])
        .default("self"), // Specify the type of post. https://www.reddit.com/dev/api#POST_api_submit
    }),
  }),
  run: async (payload, io, ctx) => {
    // Get the access token
    // First time we need to get the access token
    if (!requestOptions) {
      const response = await fetch(
        accessTokenEndpointURL,
        accessTokenRequestOptions
      );
      const responseJson = await response.json();
      requestOptions = {
        method: "POST",
        headers: {
          Authorization: `bearer ${responseJson.access_token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };
    }

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Reddit Post",
      async () => {
        // Make the request to the Reddit API
        return await fetch(endpointURL, {
          ...requestOptions,
          body: stringify({ ...payload, api_type: "json" }),
        }).then((response) => response.json());
      },
      // Add metadata to the task to improve the display in the logs
      { name: "Reddit Post", icon: "reddit" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
