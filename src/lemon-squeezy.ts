import z from "zod";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";

// The import path here has been updated because of conflict between commonjs and ESmodule
// when using in proper ESmodule setup you won't have to do this
import LemonSqueezy from "@lemonsqueezy/lemonsqueezy.js/dist/index.cjs";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Get API key from https://docs.lemonsqueezy.com/api#authentication
const ls = new LemonSqueezy(process.env.LEMONSQUEEZY_API_KEY!);

// Using the official SDK; https://github.com/lmsqueezy/lemonsqueezy.js
client.defineJob({
  id: "get-lemon-squeezy-store-details",
  name: "Get Lemon Squeezy store details",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "get-lemon-squeezy-store-details",
    schema: z.object({
      id: z.string(),
      include: z
        .array(
          z.enum([
            "products",
            "discounts",
            "license-keys",
            "subscriptions",
            "webhooks",
          ])
        )
        .optional(),
    }),
  }),
  run: async (payload, io) => {
    await io.runTask(
      "Get Lemon Squeezy store details",
      async () => {
        const store = await ls.getStore({
          id: payload.id,
          include: payload.include,
        });
        // The return value has to be JSON serializable as it's stored in the database.
        return JSON.parse(JSON.stringify(store));
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Get Lemon Squeezy store details", icon: "lemonSqueezy" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
