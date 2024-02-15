import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Docs: https://developer.rippling.com/docs/rippling-api/fucwnbc121hiu-installation-o-auth-guide
// Follow the steps in the docs to retrieve access token
// Set the `RIPPLING_ACCESS_TOKEN` (Secret) in the .env file.
const endpointURL = `${process.env.RIPPLING_BASE_URL}/platform/api/groups`;

// Create request options
const requestOptions: RequestInit = {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: `Bearer ${process.env.RIPPLING_ACCESS_TOKEN}`,
  },
};

client.defineJob({
  id: "rippling-create-group",
  name: "Rippling Create Group",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "rippling-create-group",
    schema: z.object({
      name: z.string(),
      spokeId: z.string(),
      users: z.array(z.string()),
    }),
  }),
  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "rippling create group",
      async () => {
        const res = await fetch(endpointURL, {
          ...requestOptions,
          body: JSON.stringify({ payload }),
        });

        return res.json();
      },

      // Add metadata to improve how the task displays in the logs
      { name: "rippling create group", icon: "rippling" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
