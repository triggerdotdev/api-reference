import nacl from 'tweetnacl'
import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

const verifyRequestSignature = async (request: Request): Promise<any[]> => {
    const body = await request.text();
    const jsonBody = JSON.parse(body)
    const signature = request.headers.get('x-signature-ed25519')
    const timestamp = request.headers.get('x-signature-timestamp')
    const discordKey = process.env.DISCORD_APPLICATION_KEY
    if (!discordKey || !signature || !timestamp) return [false, jsonBody]
    return [nacl.sign.detached.verify(
        Buffer.from(timestamp + body),
        Buffer.from(signature, "hex"),
        Buffer.from(discordKey, "hex")
    ), jsonBody];
}

const discord = client.defineHttpEndpoint({
    id: "discord",
    source: "discord.com",
    icon: "discord",
    // only needed for strange APIs like Discord which don't setup the webhook until you pass the test
    respondWith: {
        // don't trigger runs if they match this filter
        skipTriggeringRuns: true,
        filter: {
            method: ["POST"],
        },
        handler: async (request) => {
            const success = await verifyRequestSignature(request)
            console.log('[Handler]:')
            console.log(success[0])
            if (!success[0]) return new Response("Unauthorized", { status: 401 });
            const { type } = success[1]
            return new Response(JSON.stringify({ type }), { headers: { 'Content-Type': 'application/json' } });
        },
    },
    verify: async (request) => {
        const success = await verifyRequestSignature(request)
        console.log('[Verify]:')
        console.log(success[0])
        if (success[0]) return { success: success[0] };
        return { success: false, reason: "Failed ed25519 verification" };
    },
});

// Job that runs when the HTTP endpoint is called from Discord
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
