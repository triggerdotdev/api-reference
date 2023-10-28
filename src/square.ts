import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { Client, Environment } from "square";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// SDK: https://developer.squareup.com/docs/sdks/nodejs
// Initialize the Square client with your credentials
const squareClient = new Client({
    environment: Environment.Production, // Use Square.Environment.Sandbox for testing
    accessToken: process.env.SQUARE_ACCESS_TOKEN!, // Get your access token at https://developer.squareup.com/docs/build-basics/access-tokens
});

client.defineJob({
    id: "square-create-customer",
    name: "Square create customer",
    version: "1.0.0",
    trigger: eventTrigger({
        name: "square-create-customer",
        schema: z.object({
            givenName: z.string(),
            familyName: z.string().optional(),
            companyName: z.string().optional(),
            emailAddress: z.string().optional(),
            phoneNumber: z.string().optional(),
        }),
    }),
    run: async (payload, io, ctx) => {

        // Wrap an SDK call in io.runTask so it's resumable and displays in logs
        await io.runTask(
            "Square create customer",
            async () => {
                // Use the Square SDK to send a message to the seller
                const customersApi = squareClient.customersApi;

                // After create a customer you can see it in the Square dashboard
                // at https://squareup.com/dashboard/customers/directory/all
                // See more https://developer.squareup.com/reference/square/customers-api/create-customer
                await customersApi.createCustomer(payload);
            },

            // Add metadata to the task to improve the display in the logs
            { name: "Square create customer", icon: "square" }
        );
    },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
