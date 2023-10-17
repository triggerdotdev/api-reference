import { TriggerClient, cronTrigger, eventTrigger } from "@trigger.dev/sdk";
import { Octokit } from "octokit";
import z from "zod";

// ! We now have a GitHub integration, which we recommend using instead of the Octokit SDK
// ! GitHub integration docs: https://trigger.dev/docs/integrations/apis/github

const client = new TriggerClient({ id: "api-reference" });

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Using Octokit, the official GitHub SDK; https://github.com/octokit/octokit.js
client.defineJob({
  id: "get-github-repo",
  name: "Get GitHub repo",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "github",
    schema: z.object({
      owner: z.string(),
      repo: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    //wrap an SDK call in io.runTask so it's resumable and displays in logs
    const repo = await io.runTask(
      "Get repo",
      async () => {
        //this is the regular GitHub SDK
        const response = await octokit.rest.repos.get({
          owner: payload.owner,
          repo: payload.repo,
        });
        return response.data;
      },
      //you can add metadata to the task to improve the display in the logs
      { name: "Get repo", icon: "github" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
