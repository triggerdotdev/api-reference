import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { google } from "googleapis";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// Get your API key here: https://console.developers.google.com/apis/credentials
// Make sure to enable the YouTube Data API v3 https://console.cloud.google.com/apis/library/youtube.googleapis.com
// SDK Docs: https://developers.google.com/youtube/v3/quickstart/nodejs
// Initialize the YouTube API with your API key
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

client.defineJob({
  id: "youtube-api-search",
  name: "YouTube API Search",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "youtube-search",
    schema: z.object({
      q: z.string(),
      maxResults: z.number().optional(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { q, maxResults } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "YouTube API Search",
      async () => {
        const searchResponse = await youtube.search.list({
          q,
          maxResults: maxResults || 10, // Default to 10 results if not provided
          part: ["snippet"],
          type: ["video"],
        });

        // Process the search results here
        return JSON.parse(JSON.stringify(searchResponse.data));
      },

      // Add metadata to improve how the task displays in the logs
      { name: "YouTube API Search", icon: "youtube" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
