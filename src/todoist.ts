import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { TodoistApi } from "@doist/todoist-api-typescript"


const client = new TriggerClient({ id: "api-reference" });

// https://developer.todoist.com/rest/v2/?javascript#getting-started
// find your api reference https://todoist.com/help/articles/find-your-api-token-Jpzx9IIlB
const todoistClientApi = new TodoistApi(process.env.T0DOIST_API_REF!)


client.defineJob({
  id: "todoist-add-new-project",
  name: "Todoist add new project",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "todoist.add.project",
    schema: z.object({
      name: z.string()  // name of the project
    }),
  }),

  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    const user = await io.runTask(
      "Add New Project",
      async () => {
        // This is the regular Todoist Api client
        return await todoistClientApi.addProject({name: payload.name})
      },
      // You can add metadata to the task to improve the display in the logs
      { name: "Add Todoist project", icon: "todoist" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
