import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

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
    // Here we use `backgroundFetch` which allows you to fetch data from
    // a URL that can take longer than the serverless timeout.
    const response = (await io.backgroundFetch(
      "create-image-from-text",
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
      },
      {
        "429": {
          strategy: "backoff",
          limit: 10,
          minTimeoutInMs: 1000,
          maxTimeoutInMs: 60000,
          factor: 2,
          randomize: true,
        },
      }
    )) as GenerationResponse;

    // Do something with the returned image(s).
    // Learn about using cache keys with loops here:
    // https://trigger.dev/docs/documentation/concepts/resumability#how-to-use-cache-keys-with-loops
    for (const [index, artifact] of response.artifacts.entries()) {
      await io.runTask(
        `Image ${index + 1}/${payload.samples ?? 1}`,
        async () => {
          const imageUrl = `data:image/png;base64,${artifact.base64}`;
          return imageUrl;
        }
      );
    }

    return response;
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
