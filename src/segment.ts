import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";
import * as PublicAPI from "@segment/public-api-sdk-typescript";

const client = new TriggerClient({ id: "api-reference" });

// Guide to create a segment public api: https://segment.com/docs/api/public-api/
// You need to upgrade your account to a team account or business to get access to the public API.
const publicAPI = PublicAPI.configureApis(
  process.env.SEGMENT_PUBLIC_API_KEY ?? ""
);

client.defineJob({
  id: "segment-get-source",
  name: "Segment Get Source",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "segment-get-source",
    schema: z.object({
      sourceId: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { sourceId } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "segment get source",
      async () => {
        const source = await publicAPI.sources.getSource(sourceId);
        return JSON.parse(JSON.stringify(source));
      },

      // Add metadata to improve how the task displays in the logs
      { name: "segment get source", icon: "segment" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
