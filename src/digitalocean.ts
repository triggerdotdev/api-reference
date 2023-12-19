import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// API reference: https://docs.digitalocean.com/reference/api/api-reference/#operation/uptime_create_check
// Create tokens at
// https://docs.digitalocean.com/reference/api/create-personal-access-token/

const endpointURL = "https://api.digitalocean.com/v2/uptime/checks";

client.defineJob({
  id: "digitalocean",
  name: "DigitalOcean uptime create",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "digitalocean",
    schema: z.object({
      name: z.string(),
      type: z.enum(["http", "https", "ping"]).default("https"),
      target: z.string(),
      regions: z.string().array().default(["us_east", "eu_west"]),
      enabled: z.boolean().default(true),
    }),
  }),
  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "DigitalOcean",
      async () => {
        // Make request using Fetch API
        return await fetch(endpointURL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.DIGITALOCEAN_TOKEN}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        }).then((response) => response.json());
      },

      // Add metadata to improve how the task displays in the logs
      { name: "DigitalOcean uptime create", icon: "digitalocean" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
