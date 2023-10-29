import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// Initialize Trigger client
const client = new TriggerClient({ id: "api-reference" });

// Snyk API endpoints
const endpointURL = `${process.env.SNYK_BASE_URL}/user/me`;
const createOrgEndpontUrl = `${process.env.SNYK_BASE_URL}/org`;

// Standard request options for Snyk API
const requestOptions: RequestInit = {
   headers: {
     "Content-Type": "application/json; charset=utf-8",
     "Authorization": `${process.env.SNYK_AUTH_TOKEN}`
   }
};

// Defined the job to get user details from Snyk
client.defineJob({
   id: "snyk-get-my-user-details",
   name: "Snyk get my user details",
   version: "1.0.0",
   trigger: eventTrigger({ name: "snyk-get-profile" }),
   run: async (payload, io, ctx) => {
     const res = await io.runTask(
       "Get Snyk me user details",
       async () => {
         const response = await fetch(endpointURL, { method: "GET", ...requestOptions });

         // Ensure successful fetch
         if (!response.ok) {
            throw new Error(`Failed to fetch user details: ${response.statusText}`);
         }
         return response.json();
       },
       { name: "get snyk me user details", icon: "snyk" }
     );
   },
 });

// Defined the job to create a new organization in Snyk
client.defineJob({
   id: "snyk-create-org",
   name: "Snyk create new organization",
   version: "1.0.0",
   trigger: eventTrigger({
     name: "snyk-add-org",
     schema: z.object({  // Validating input payload
       name: z.string(),
       groupId: z.string(),
       sourceOrgId: z.string()
     })
   }),
   run: async (payload, io, ctx) => {
     const res = await io.runTask(
       "Create Organization",
       async () => {
         const response = await fetch(createOrgEndpontUrl, {
           method: "POST",
           ...requestOptions,
           body: JSON.stringify(payload),
         });

         // Ensuring successful fetch
         if (!response.ok) {
            throw new Error(`Failed to create organization: ${response.statusText}`);
         }
         return response.json();
       },
       { name: "create new organization in snyk", icon: "snyk" }
     );
   },
 });

// Start express server for Trigger client
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
