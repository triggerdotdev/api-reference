import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// This code integrates the ZBD API to facilitate Bitcoin payments to ZBD usernames.
// To use this integration, you need to create a ZBD project, which provides a unique API key
// and a Bitcoin Lightning wallet. With this API key, you can programmatically handle Bitcoin
// transactions, including receiving funds, making payments, and withdrawing Bitcoin.
// Learn how to create a project: [Create a project](https://zbd.dev/docs/dashboard/projects/create)
// Detailed instructions for using the API key: [API Key Usage](https://zbd.dev/docs/dashboard/projects/api)

client.defineJob({
  id: "pay-to-zbd-username",
  name: "Pay BTC to ZBD username",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "zbd.pay.username",
    schema: z.object({
      amount: z.number(), // The amount for the Payment in millisatoshis
      gamertag: z.string(),
      description: z.string().optional(),
    }),
  }),

  run: async (payload, io, ctx) => {
    // Wrap any ZBD API call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Send sats to username",
      async () => {
        const options = {
          method: "POST",
          headers: {
            apikey: process.env.ZBD_API_KEY!,
            "Content-Type": "application/json",
          },
          body: `{"amount":"${payload.amount}","gamertag":"${payload.gamertag}","description":"${payload.description}"}`,
        };

        const response = await fetch(
          `${process.env.ZBD_BASE_URL}/v0/gamertag/send-payment`,
          options
        );
        return response.json();
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Pay BTC to ZBD Username", icon: "zbd" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
