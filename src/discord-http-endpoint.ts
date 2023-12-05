import nacl from "tweetnacl";
import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

const verifyRequestSignature = async (request: Request): Promise<any[]> => {
  const body = await request.text();
  const jsonBody = JSON.parse(body);
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const discordKey = process.env.DISCORD_APPLICATION_KEY;
  if (!discordKey || !signature || !timestamp) return [false, jsonBody];
  return [
    nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, "hex"),
      Buffer.from(discordKey, "hex")
    ),
    jsonBody,
  ];
};

const discord = client.defineHttpEndpoint({
  id: "discord",
  source: "discord.com",
  icon: "discord",
  // This is only needed for APIs like Discord which don't setup the webhook until you pass the test
  respondWith: {
    // Don't trigger runs if they match this filter
    skipTriggeringRuns: true,
    filter: {
      method: ["POST"],
    },
    handler: async (request) => {
      const success = await verifyRequestSignature(request);
      // If Discord signature and timestamp don't match, return 401
      if (!success[0]) return new Response("Unauthorized", { status: 401 });
      // If successful, get the Interaction Type sent by Discord of the request
      const { type } = success[1];
      // If it's type 1, it's a PING from discord, just respond with the type as is
      if (Number(type) === 1)
        return new Response(JSON.stringify({ type }), {
          headers: { "Content-Type": "application/json" },
        });
      // If it's type 2, it's a Slash Command from Discord, respond with what you want to be replied
      if (Number(type) === 2)
        return new Response(
          JSON.stringify({
            type: 4,
            data: {
              content: `Hello, New!`,
            },
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      // If not either of the above types, just return a 400
      return new Response(JSON.stringify({ error: "bad request" }), {
        status: 400,
      });
    },
  },
  verify: async (request) => {
    const success = await verifyRequestSignature(request);
    if (success[0]) return { success: success[0] };
    return { success: false, reason: "Failed ed25519 verification" };
  },
});

// A job that runs when the HTTP endpoint is called from Discord
client.defineJob({
  id: "http-discord",
  name: "HTTP Discord",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: discord.onRequest(),
  run: async (request, io, ctx) => {
    const body = await request.json();
    await io.logger.info(`Body`, body);
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
