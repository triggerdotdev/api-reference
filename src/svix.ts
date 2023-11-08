import z from "zod";
import { Svix } from "svix";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Create an access token at https://api.svix.com/docs#section/Introduction/Authentication
// https://dashboard.svix.com/api-access
const svix = new Svix(process.env.SVIX_API_KEY!);

// Using official Svix sdk, https://github.com/svix/svix-webhooks/tree/main/javascript/
client.defineJob({
  id: "create-svix-application",
  name: "Create Svix application",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "create-svix-application",
    schema: z.object({
      name: z.string(),
      uid: z.string().optional(),
      rateLimit: z.number().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
    }),
  }),
  run: async (payload, io) => {
    await io.runTask(
      "Create application",
      async () => {
        const app = await svix.application.create({
          name: payload.name,
          rateLimit: payload.rateLimit,
          uid: payload.uid,
          metadata: payload.metadata,
        });
        return app;
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Create application", icon: "svix" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
