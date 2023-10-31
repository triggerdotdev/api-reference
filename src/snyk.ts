import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// Replace this URL with the actual API endpoint you want to call in Snyk
// https://docs.snyk.io/snyk-api/authentication-for-api
const endpointURL = `${process.env.SNYK_BASE_URL}/user/me`;
const createOrgEndpontUrl = `${process.env.SNYK_BASE_URL}/org`;

// Create request options
const requestOptions: RequestInit = {
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    // You can find your token in your General Account Settings on
    // https://snyk.io/account/. See Authentication for API details.
    Authorization: `${process.env.SNYK_AUTH_TOKEN}`,
  },
};

client.defineJob({
  id: "snyk-get-my-user-details",
  name: "Snyk get my user details",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "snyk-get-profile",
  }),
  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Get Snyk me user details",
      async () => {
        const response = await fetch(endpointURL, {
          method: "GET",
          ...requestOptions,
        });

        // Return the response body
        const res = await response.json();
        return res;
      },

      // Add metadata to improve how the task displays in the logs
      { name: "get snyk me user details", icon: "snyk" }
    );
  },
});

// Create organization in Snyk

// client.defineJob({
//   id: "snyk-create-org",
//   name: "Snyk create new organization",
//   version: "1.0.0",
//   trigger: eventTrigger({
//     name: "snyk-add-org",
//     schema: z.object({
//       name: z.string(),
//       groupId: z.string(),
//       sourceOrgId: z.string(),
//     }),
//   }),
//   run: async (payload, io, ctx) => {
//     // Wrap an SDK call in io.runTask so it's resumable and displays in logs
//     await io.runTask(
//       "Create Organization",
//       async () => {
//         // Make request using Fetch API
//         const response = await fetch(createOrgEndpontUrl, {
//           method: "POST",
//           ...requestOptions,
//           body: JSON.stringify(payload),
//         });

//         // Return the response body
//         const res = await response.json();
//         return res;
//       },

//       // Add metadata to improve how the task displays in the logs
//       { name: "create new organization in snyk", icon: "snyk" }
//     );
//   },
// });

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
