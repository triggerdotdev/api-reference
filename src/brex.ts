import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// Docs: https://developer.brex.com/openapi/team_api/#tag/Titles
// API: https://developer.brex.com/openapi/team_api/#operation/createTitle
const endpointURL = `${process.env.BREX_BASE_URL}/titles`; // Replace with the Other Brex API endpoint 

// Create tokens at https://developer.brex.com/docs/quickstart/#1-generate-your-user-token
// SCOPES: Titles:read, write
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
            name: z.string() // Name of the title. You can see the all titles in the teams section. https://dashboard.brex.com/p/team/titles
        }),
    }),
    run: async (payload, io, ctx) => {
        // Wrap an SDK call in io.runTask so it's resumable and displays in logs
        await io.runTask(
            "Brex Create Title",
            async () => {
                // Make a request to the Brex API using fetch API
                const response = await fetch(endpointURL, {
                    ...requestOptions,
                    body: JSON.stringify(payload), // Include the payload for your specific API request
                });

                // Return the response body
                return await response.json();
            },

            // Add metadata to the task to improve the display in the logs
            { name: "Brex Create Title", icon: "brex" }
        );
    },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
