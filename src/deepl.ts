import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import * as deepl from "deepl-node";

const client = new TriggerClient({ id: "api-reference" });

const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY!);

client.defineJob({
  id: "deepl-translate",
  name: "DeepL Translate",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "deepl.translate",
    schema: z.object({
      text: z.string(),
      targetLang: z.string(),
    }),
  }),

  run: async (payload, io, ctx) => {
    // Wrap any SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Translate text",
      async () => {
        const targetLang = payload.targetLang as deepl.TargetLanguageCode;
        const result = await translator.translateText(
          payload.text,
          null,
          targetLang
        );
        return result;
      },
      // You can add metadata to the task to improve the display in the logs
      { name: "DeepL Translate Text", icon: "deepl" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
