import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// Define the Trigger.dev client
const client = new TriggerClient({ id: "api-reference" });

// Define the job
client.defineJob({
  id: "get-snyk-project",
  name: "Get Snyk project",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "snyk",
    schema: z.object({
      projectId: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    // Wrap the Snyk API call in io.runTask so it's resumable and displays in logs
    const project = await io.runTask(
      "Get project",
      async (): Promise<any>=> {
        // Use dynamic import to get fetch from node-fetch
        const fetch = (await import('node-fetch')).default;

        // Use fetch to get project details from the Snyk API
        const response = await fetch(`https://snyk.io/api/v1/org/<org-id>/project/${payload.projectId}`, {
          method: 'GET',
          headers: {
            'Authorization': '<snyk-api-token>'
          }
        });
        const data = await response.json();
        return data;
      },
      // Add metadata to the task to improve the display in the logs
      { name: "Get project", icon: "snyk" }
    );
  },
});

// If you want to use express, include the following lines
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
