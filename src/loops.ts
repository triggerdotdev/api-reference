import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// Replace this URL with the actual API endpoint you want to call in Loops
const endpointURL = `${process.env.LOOPS_BASE_URL}/contacts/create`;

// Create request options
const requestOptions: RequestInit = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // To create an API key for Loops, go to the API settings in your account,
    // generate a new key and set permissions: https://loops.so/docs/api
    Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
  },
};

client.defineJob({
  id: "loops-create-contract",
  name: "Loops create contract",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "loops-create-contract",
    schema: z.object({
      email: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      favoriteColor: z.string(),
      userGroup: z.string(),
      source: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "loops create contract",
      async () => {
        const response = await fetch(endpointURL, {
          ...requestOptions,
          body: JSON.stringify(payload),
        });

        return await response.json();
      },

      // Add metadata to improve how the task displays in the logs
      { name: "loops create contract", icon: "loops" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
