import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Docs: https://developer.brex.com/openapi/team_api/#tag/Titles
// API: https://developer.brex.com/openapi/team_api/#operation/createTitle
const endpointURL = `${process.env.BREX_BASE_URL}/titles`; // Replace with the Other Brex API endpoint

// Create tokens at https://developer.brex.com/docs/quickstart/#1-generate-your-user-token
// Scopes: Titles: read, write
// Create request options
const requestOptions: RequestInit = {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.BREX_API_KEY}`,
    "Content-Type": "application/json",
  },
};

client.defineJob({
  id: "brex-create-title",
  name: "Brex Create Title",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "Brex Create Title",
    schema: z.object({
      // Name of the title. You can see the all titles in the teams section.
      // https://dashboard.brex.com/p/team/titles
      name: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Brex Create Title",
      async () => {
        // Make a request to the Brex API using the fetch API
        const response = await fetch(endpointURL, {
          ...requestOptions,
          body: JSON.stringify(payload),
        });

        // Return the response body
        return await response.json();
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Brex Create Title", icon: "brex" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
