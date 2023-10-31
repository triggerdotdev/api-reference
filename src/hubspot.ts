import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { Client } from "@hubspot/api-client";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// SDK: https://github.com/hubspot/hubspot-api-nodejs
// API Reference: https://developers.hubspot.com/docs/api/overview
// Create an private app in HubSpot and get access token : https://developers.hubspot.com/docs/api/private-apps
const hubspot = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

client.defineJob({
  id: "hubspot-create-contact",
  name: "HubSpot Create Contact",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "hubspot-create-contact",
    schema: z.object({
      firstname: z.string(),
      lastname: z.string(),
      email: z.string().email(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { firstname, lastname, email } = payload;

    await io.runTask(
      "Create HubSpot Contact",
      async () => {
        // Create a contact in HubSpot
        await hubspot.crm.contacts.basicApi.create({
          properties: { firstname, lastname, email },
          associations: [], // Optional
        });
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Create HubSpot Contact", icon: "hubspot" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
