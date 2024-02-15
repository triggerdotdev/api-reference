import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

// Anthropic TypeScript SDK Reference: https://github.com/anthropics/anthropic-sdk-typescript
// To get your API key follow: https://docs.anthropic.com/claude/docs/getting-access-to-claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

client.defineJob({
  id: "anthropic",
  name: "Anthropic AI",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "anthropic",
    schema: z.object({
      prompt: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { prompt } = payload;
    await io.runTask("Anthropic AI", async () => {
      const res = await anthropic.completions.create({
        model: "claude-2.1",
        max_tokens_to_sample: 300,
        prompt: `${Anthropic.HUMAN_PROMPT} ${prompt}${Anthropic.AI_PROMPT}`,
      });

      return res.completion;
    }),
      { name: "Anthropic", icon: "anthropic" };
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
