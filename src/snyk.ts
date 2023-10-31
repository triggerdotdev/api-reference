import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";


const client = new TriggerClient({ id: "api-reference" });

// Replace this URL with the actual API endpoint you want to call in a snyk 
// https://docs.snyk.io/snyk-api/authentication-for-api
const endpointURL = `${process.env.SNYK_BASE_URL}/user/me`;
const createOrgEndpontUrl = `${process.env.SNYK_BASE_URL}/org`;

// Create request options 
const requestOptions: RequestInit = {
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    //To use this API, you must get your API token from Snyk.
    //You can find your token in your General Account Settings on
    // https://snyk.io/account/ after you register with Snyk and log in. See Authentication for API.
    "Authorization": `${process.env.SNYK_AUTH_TOKEN}`,
  }
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
        // Make request using Fetch API
        const response = await fetch(endpointURL, {
          method: "GET",
          ...requestOptions,
        });

        // Return the response body
        const res = await response.json();
        return res;
      },

      // Add metadata to the task to improve the display in the logs
      { name: "get snyk me user details", icon: "snyk" }
    );
  },
});


client.defineJob({
  id: "snyk-create-org",
  name: "Snyk create new organization",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "snyk-add-org",
    schema: z.object({
      name: z.string(),
      groupId: z.string(),
      sourceOrgId: z.string()
    })
  }),
  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Create Organization",
      async () => {
        // Make request using Fetch API
        const response = await fetch(createOrgEndpontUrl, {
          method: "POST",
          ...requestOptions,
          body: JSON.stringify(payload),
        });

        // Return the response body
        const res = await response.json();
        return res;
      },

      // Add metadata to the task to improve the display in the logs
      { name: "create new organization in snyk", icon: "snyk" }
    );
  },
});




// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
