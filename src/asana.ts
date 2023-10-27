import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

const asana = require("asana");

const client = new TriggerClient({ id: "api-reference" });

// Create a personal access token: https://developers.asana.com/docs/personal-access-token
const asanaClient = asana.Client.create().useAccessToken(
  process.env.ASANA_ACCESS_TOKEN
);

client.defineJob({
  id: "asana-get-user",
  name: "Asana Get User",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "asana.get.user",
    schema: z.object({
      // This can either be the string "me", an email, or the gid of a user.
      // You can get your user gid by first logging in to Asana in your browser,
      // then visiting https://app.asana.com/api/1.0/users/me.
      userGid: z.string(),
    }),
  }),

  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    const user = await io.runTask(
      "Get user",
      async () => {
        // This is the regular Asana SDK
        return asanaClient.users.getUser(payload.userGid);
      },
      // You can add metadata to the task to improve the display in the logs
      { name: "Get Asana User", icon: "asana" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
