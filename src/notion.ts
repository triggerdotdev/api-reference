import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { Client } from "@notionhq/client";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// API Reference: https://developers.notion.com/reference/intro
// Create a new integration and access your token at https://www.notion.so/my-integrations 
// Create a Notion client
const notion = new Client({
 auth: process.env.NOTION_TOKEN!,
});

// Define the job trigger
client.defineJob({
 id: "notion-get-page",
 name: "Notion Get Page",
 version: "1.0.0",
 trigger: eventTrigger({
   name: "notion-get-page",
   schema: z.object({
    pageId: z.string(), // The ID of the Notion page to retrieve
   }), 
  }),
 run: async (payload, io, ctx) => {
   const page = await io.runTask(
     "Get Notion page",
     async () => {
      // Retrieve the Notion page
      return notion.pages.retrieve({ page_id: payload.pageId });
    },
    { name: "Get page", icon: "notion" }
  );

  //  Return the page object
   return page;
 },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
