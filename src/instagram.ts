import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// You need a professional Instagram account that is connected with your facebook business account
// Get started from here: https://developers.facebook.com/docs/instagram-api/getting-started
// For permanent token you have to create system user: https://business.facebook.com/settings/system-users
// You can find your instagram user id from here: https://business.facebook.com/settings/instagram-account-v2s
const token = {
  userId: process.env.INSTAGRAM_USER_ID!,
  accessToken: process.env.FACEBOOK_ACCESS_TOKEN!,
};
const endpointURLCreate = `https://graph.facebook.com/v18.0/${token.userId}/media`;
const endpointURLPublish = `https://graph.facebook.com/v18.0/${token.userId}/media_publish`;

client.defineJob({
  id: "post-instagram",
  name: "Post on Instagram",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "post-instagram",
    schema: z.object({
      caption: z.string().max(2200), // instagram captions are limited to 2200 characters
      imageUrl: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    // wrap the SDK call in io.runTask for resumability and log display
    await io.runTask(
      "Post on Instagram",
      async () => {
        // Publishing a single media post is a two step process,
        // Step 1: Create container
        const createContainerUrl = `${endpointURLCreate}?image_url=${
          payload.imageUrl
        }&caption=${encodeURIComponent(payload.caption)}&access_token=${
          token.accessToken
        }`;

        const containerResponse = await fetch(createContainerUrl, {
          method: "POST",
        }).then((response) => response.json());

        // Extract container ID
        const containerId = containerResponse.id;

        // Step 2: Publish container
        const publishContainerUrl = `${endpointURLPublish}?creation_id=${containerId}&access_token=${token.accessToken}`;

        const publishResponse = await fetch(publishContainerUrl, {
          method: "POST",
        }).then((response) => response.json());

        return publishResponse;
      },

      // Add metadata to the task to improve the display in the logs
      { name: "Post to Instagram", icon: "instagram" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
