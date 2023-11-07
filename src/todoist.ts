import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { TodoistApi } from "@doist/todoist-api-typescript";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// https://developer.todoist.com/rest/v2/?javascript#getting-started
// find your api reference https://todoist.com/help/articles/find-your-api-token-Jpzx9IIlB
const todoistClientApi = new TodoistApi(process.env.TODOIST_API_TOKEN!);

client.defineJob({
  id: "todoist-add-new-project",
  name: "Todoist add new project",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "todoist.add.project",
    schema: z.object({
      name: z.string(), // name of the project
    }),
  }),

  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    const user = await io.runTask(
      "Add New Project",
      async () => {
        return await todoistClientApi.addProject({ name: payload.name });
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Add Todoist project", icon: "todoist" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
