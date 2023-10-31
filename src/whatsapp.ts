import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// You have to need Whatsapp Business API account
// Get started https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
// For Permanent token you have to create system user https://business.facebook.com/settings/system-users
// User need to first send message then you can send message to user via API. Only hello_world message is allowed for first message.
// Learn more about cloud-api https://developers.facebook.com/docs/whatsapp/cloud-api/reference
const endpointURL = `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

// Create request options
const requestOptions: RequestInit = {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_BEARER_TOKEN}`,
    "content-type": "application/json",
  },
};

client.defineJob({
  id: "whatsapp-send-messages",
  name: "Whatsapp Send Messages",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "whatsapp-send-messages",
    schema: z.object({
      text: z.string(),
      to: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { text, to } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Whatsapp Send Messages",
      async () => {
        // Make request using Fetch API
        return await fetch(endpointURL, {
          ...requestOptions,
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: {
              body: text,
            },
          }),
        }).then((response) => response.json());
      },

      // Add metadata to the task to improve the display in the logs
      { name: "Whatsapp Send Messages", icon: "whatsapp" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
