import LemonSqueezy from "@lemonsqueezy/lemonsqueezy.js/dist/index.cjs";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";

// 
const client = new TriggerClient({ id: "api-reference" });

// Get API key from https://docs.lemonsqueezy.com/api#authentication
const ls = new LemonSqueezy(process.env.LEMONSQUEEZY_API_KEY!);

// Using official SDK; https://github.com/lmsqueezy/lemonsqueezy.js
client.defineJob({
  id: "get-lemon-squeezy-current-user",
  name: "Get Lemon Squeezy current user",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "get-lemon-squeezy-current-user",
  }),
  run: async (payload, io) => {
    await io.runTask(
      "Get Lemon Squeezy current user",
      async () => {
        const user = await ls.getUser();
        // The return value has to be JSON serialiazable as it is stored in the databse.
        // Thus stringifying and then parsing it in order to make sure that it is always a serializable JSON
        return JSON.parse(JSON.stringify(user));
      },
      //you can add metadata to the task to improve the display in the logs
      { name: "Get Lemon Squeezy current user", icon: "lemonSqueezy" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
