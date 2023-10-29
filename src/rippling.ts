// Import necessary packages and libraries
import { eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// Define the fetch function signature for type safety
let fetch: ((url: URL | RequestInfo, init?: RequestInit | undefined) => Promise<Response>) | ((arg0: string, arg1: { method: string; headers: { Authorization: string; }; }) => any);

// Use dynamic import to fetch the node-fetch library
import('node-fetch').then(fetchedModule => {
    fetch = fetchedModule.default || fetchedModule;
});

// Set up TriggerClient with the SDK
const TriggerClient = require("@trigger.dev/sdk").TriggerClient;

// Define the payload schema for the rippling event
const ripplingPayloadSchema = z.object({
    eventId: z.string(),
    eventData: z.object({
        timestamp: z.string(),
        action: z.string(),
        resource: z.string()
    })
});

// Initialize the Trigger client with an ID
const client = new TriggerClient({ id: "api-reference" });

// Define the job with its details, triggers, and run function
client.defineJob({
    id: "rippling-api-job",
    name: "Rippling API Job",
    version: "0.1.0",
    trigger: eventTrigger({
        name: "rippling-event",
        schema: ripplingPayloadSchema
    }),
    run: async () => {
        // If fetch is not initialized, try initializing it before using
        if (!fetch) {
            const fetchedModule = await import('node-fetch');
            fetch = fetchedModule.default || fetchedModule;
        }

        // Make a request to the Rippling API
        const response = await fetch('RIPPLING_API_ENDPOINT', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer TOKEN'
            }
        });

        // Parse the response to JSON and return the data
        const data = await response.json();
        return data;
    }
});

// Set up express server for integration with the Trigger client
const { createExpressServer } = require("@trigger.dev/express");
createExpressServer(client);
