import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { Client } from "@notionhq/client";
import z from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// API Reference: https://developers.notion.com/reference/intro
// Create a new integration and access your token at https://www.notion.so/my-integrations
// The integration needs to be added as a 'connection' to the page
// Here is how you do it:
// 1. Click on three dots at the top right corner of your parent notion page
// 2. Click on 'Add connection' and choose your integration and confirm
// 3. Now it will have access to page and all the child pages too

const notion = new Client({
  auth: process.env.NOTION_TOKEN!,
});

client.defineJob({
  id: "notion-get-page",
  name: "Notion Get Page",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "notion-get-page",
    schema: z.object({
      pageId: z.string(), // The ID of the Notion page
    }),
  }),
  run: async (payload, io, ctx) => {
    const page = await io.runTask(
      "Get Notion page",
      async () => {
        // Retrieve the Notion page
        return notion.pages.retrieve({ page_id: payload.pageId });
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Get page", icon: "notion" }
    );

    return page;
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
