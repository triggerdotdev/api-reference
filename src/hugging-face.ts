import { HfInference } from "@huggingface/inference";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

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
            model: z.string(), // Hugging Face model name or ID
            inputs: z.string(), // Text to input the model
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
            // Add metadata to the task for improved log display
            { name: "Hugging Face inference", icon: "hugging-face" }
        );
    },
});

import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
