import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

const client = new TriggerClient({ id: "api-reference" });

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
      // You can add metadata to the task to improve the display in the logs
      { name: "Pay BTC to ZBD Username", icon: "zbd" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
