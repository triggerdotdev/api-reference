import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { stringify } from "querystring";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

const endpointURLs = {
  accessToken: "https://www.reddit.com/api/v1/access_token",
  submit: "https://oauth.reddit.com/api/submit",
  revoke: "https://www.reddit.com/api/v1/revoke_token",
};

// Get the Reddit client id and secret follow the instructions here:
// https://github.com/reddit-archive/reddit/wiki/OAuth2
const requestOptions: RequestInit = {
  method: "POST",
  body: stringify({
    grant_type: "password",
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
    scope: "submit",
    duration: "temporary",
  }),
  headers: {
    Authorization: `Basic ${Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
};

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
    // Getting an access token
    const accessToken = await io.runTask(
      "Getting access token...",
      async () => {
        return await fetch(endpointURLs.accessToken, requestOptions).then(
          (response) => response.json()
        );
      },
      { name: "Getting access token", icon: "reddit" }
    );

    // Posting on reddit
    const response = await io.runTask(
      "Posting on subreddit...",
      async () => {
        return await fetch(endpointURLs.submit, {
          ...requestOptions,
          headers: {
            ...requestOptions.headers,
            Authorization: `bearer ${accessToken.access_token}`,
          },
          body: stringify({ ...payload, api_type: "json" }),
        }).then((response) => response.json());
      },
      { name: "Posting on subreddit", icon: "reddit" }
    );

    // Revoking the access token
    await io.runTask(
      "Revoking access token...",
      async () => {
        return await fetch(endpointURLs.revoke, {
          ...requestOptions,
          body: stringify({
            token_type_hint: "access_token",
            token: accessToken.access_token,
          }),
        }).then((response) => response.status);
      },
      { name: "Revoking access token", icon: "reddit" }
    );

    return response;
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
