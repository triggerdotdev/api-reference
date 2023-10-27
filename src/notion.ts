import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { Client } from "@notionhq/client";
import { config } from "dotenv";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

config()

const notion = new Client({
 auth: process.env.NOTION_TOKEN,
});

// Define the job payload schema
const payloadSchema = z.object({
 pageId: z.string(), // The ID of the Notion page to retrieve
});

// Define the job trigger
client.defineJob({
 id: "notion-get-page",
 name: "Notion Get Page",
 version: "1.0.0",
 trigger: eventTrigger({
   name: "notion-get-page",
   schema: payloadSchema,
 }),
 run: async (payload, io, ctx) => {
   // Retrieve the Notion page
   const page = await notion.pages.retrieve({ page_id: payload.pageId });

   // Return the page object as the job output
   return page;
 },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);