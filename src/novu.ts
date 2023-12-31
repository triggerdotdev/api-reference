import z from "zod";
import { Novu } from "@novu/node";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Get your API key from https://web.novu.co/settings
const novu = new Novu(process.env.NOVU_API_KEY!);

// Using official SDK kit: https://docs.novu.co/sdks/nodejs
client.defineJob({
  id: "create-novu-subscriber",
  name: "Create Novu subscriber",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "create-novu-subscriber",
    schema: z.object({
      subscriberId: z.string(),
      avatar: z.string().optional(),
      email: z.string().email().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      locale: z.string().optional(),
      phone: z.string().optional(),
      data: z.record(z.string(), z.any()).optional(),
    }),
  }),
  run: async (payload, io) => {
    await io.runTask(
      "Create subscriber",
      async () => {
        const subscriber = await novu.subscribers.identify(
          payload.subscriberId,
          {
            avatar: payload.avatar,
            email: payload.email,
            firstName: payload.firstName,
            lastName: payload.lastName,
            locale: payload.locale,
            phone: payload.phone,
            data: payload.data,
          }
        );

        return subscriber.data;
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Create subscriber", icon: "novu" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
