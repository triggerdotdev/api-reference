import { eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

let fetch: ((url: URL | RequestInfo, init?: RequestInit | undefined) => Promise<Response>) | ((arg0: string, arg1: { method: string; headers: { Authorization: string; }; }) => any);
import('node-fetch').then(fetchedModule => {
    fetch = fetchedModule.default || fetchedModule;
});

const TriggerClient = require("@trigger.dev/sdk").TriggerClient;
const ripplingPayloadSchema = z.object({
    eventId: z.string(),
    eventData: z.object({
        timestamp: z.string(),
        action: z.string(),
        resource: z.string()
    })
});

const client = new TriggerClient({ id: "api-reference" });

client.defineJob({
    id: "rippling-api-job",
    name: "Rippling API Job",
    version: "0.1.0",
    trigger: eventTrigger({
        name: "rippling-event",
        schema: ripplingPayloadSchema
    }),
    run: async () => {
        if (!fetch) {
            throw new Error("node-fetch has not been initialized yet.");
        }

        const response = await fetch('RIPPLING_API_ENDPOINT', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer TOKEN'
            }
        });

        const data = await response.json();
        return data;
    }
});

// For express integration
const { createExpressServer } = require("@trigger.dev/express");
createExpressServer(client);