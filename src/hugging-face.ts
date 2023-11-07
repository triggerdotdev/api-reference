import { HfInference } from "@huggingface/inference";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Create a new Hugging Face inference client
// Get start with Hugging Face https://huggingface.co/docs/api-inference/quicktour
// SDK: https://www.npmjs.com/package/@huggingface/inference
const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

client.defineJob({
  id: "hugging-face-inference",
  name: "Hugging Face inference",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "hugging-face-inference",
    schema: z.object({
      // Hugging Face model name or ID.
      // Example: "distilbert-base-uncased-finetuned-sst-2-english"
      // More models: https://huggingface.co/models?pipeline_tag=text-classification
      model: z.string(),
      // Text to input to the model.
      // Example: "Such nice weather outside!"
      inputs: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    // Use io.runTask to make the SDK call resumable and log-friendly
    await io.runTask(
      "Hugging Face inference",
      async () => {
        // Call the Hugging Face API
        return await hf.textClassification(payload);
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Hugging Face inference", icon: "hugging-face" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
