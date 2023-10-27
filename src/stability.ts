import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

const client = new TriggerClient({ id: "api-reference" });

// This code uses the REST API for Stability AI
// Documentation can be found at: https://platform.stability.ai/docs/api-reference
const engineId = "stable-diffusion-xl-1024-v1-0";
const apiHost = process.env.API_HOST ?? "https://api.stability.ai";
const apiKey = process.env.STABILITY_API_KEY;

interface GenerationResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

client.defineJob({
  id: "stability-ai-text-to-image",
  name: "Stability AI Text to Image",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "stability.text.to.image",
    // Define the schema for text prompts used for image generation.
    // Weights can be positive or negative to influence the generation.
    //
    // text_prompts: [
    //   {
    //     "text": "A painting of a cat",
    //     "weight": 1
    //   },
    //   {
    //     "text": "blurry, bad",
    //     "weight": -1
    //   }
    // ]
    //
    // For more details, refer to the text-to-image endpoint documentation:
    // https://platform.stability.ai/docs/api-reference#tag/v1generation/operation/textToImage
    schema: z.object({
      text_prompts: z.array(
        z.object({
          text: z.string(),
          weight: z.number().optional(),
        })
      ),
      cfg_scale: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      steps: z.number().optional(),
      samples: z.number().optional(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const images = await io.runTask(
      "Create image from text",
      async () => {
        const response = await fetch(
          `${apiHost}/v1/generation/${engineId}/text-to-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              text_prompts: payload.text_prompts,
              cfg_scale: payload.cfg_scale ?? 7,
              height: payload.height ?? 1024,
              width: payload.width ?? 1024,
              steps: payload.steps ?? 50,
              samples: payload.samples ?? 1,
            }),
          }
        );

        return response.json() as Promise<GenerationResponse>;
      },
      { name: "Create image from text", icon: "stability" }
    );

    // Do something with the image
    await io.runTask("Save image", async () => {
      images.artifacts.forEach((image, index) => {
        const imageUrl = `data:image/png;base64,${image.base64}`;
        // Log the URL to the console
        io.logger.info(`Image ${index + 1}/${payload.samples ?? 1}:`, {
          imageUrl,
        });
      });
    });
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
